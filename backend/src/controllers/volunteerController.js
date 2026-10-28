import Volunteer from "../models/Volunteer.js";
import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createAdminNotification } from "../services/adminNotificationService.js";

/* =====================================================
   CREATE VOLUNTEER
===================================================== */

export async function createVolunteer(req, res) {
  try {
    const applicationNo = `VOL-${Date.now()}`;

    const { name, phone, email, city, area, message, password } = req.body || {};
    if (!String(name || "").trim() || !String(phone || "").trim()) return res.status(400).json({ success: false, message: "Name and mobile number are required." });
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const volunteer = await Volunteer.create({
      name: String(name).trim(), phone: String(phone).trim(), email: String(email || "").trim(),
      city: String(city || "").trim(), area: String(area || "").trim(), message: String(message || "").trim(),
      passwordHash, applicationNo, status: "pending",
    });
    await createAdminNotification({
      eventKey: `volunteer:${volunteer._id}:created`,
      type: "volunteer",
      title: "New volunteer application",
      message: `${volunteer.name} submitted a volunteer application${volunteer.phone ? ` (${volunteer.phone})` : ""}.`,
      entityId: String(volunteer._id),
    });
    const item = volunteer.toObject();
    delete item.passwordHash;
    item.passwordSet = Boolean(passwordHash);
    return res.status(201).json({ success: true, message: "Volunteer application submitted successfully.", item });
  } catch (error) {
    console.error("Create volunteer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit volunteer application.",
    });
  }
}

/* =====================================================
   UPDATE VOLUNTEER
   UPDATE DETAILS + STATUS
===================================================== */

export async function updateVolunteerStatus(req, res) {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      email,
      city,
      area,
      message,
      status,
    } = req.body;

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
    ];

    // Status validation
    if (
      status &&
      !allowedStatuses.includes(status.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid volunteer status.",
      });
    }

    // Data to update
    const updateData = {
      name: name?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      city: city?.trim(),
      area: area,
      message: message?.trim(),
    };
    if (typeof req.body.password === "string" && req.body.password.length > 0) {
      if (req.body.password.length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
      updateData.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    // Status bhi update karo
    if (status) {
      updateData.status = status.toLowerCase();
    }

    const volunteer =
      await Volunteer.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      ).select("+passwordHash");

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found.",
      });
    }

    const item = volunteer.toObject();
    const passwordSet = Boolean(updateData.passwordHash || item.passwordHash);
    delete item.passwordHash;
    item.passwordSet = passwordSet;
    return res.status(200).json({ success: true, message: "Volunteer details updated successfully.", item });

  } catch (error) {
    console.error(
      "Update volunteer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update volunteer details.",
    });
  }
}
/* =====================================================
   DELETE VOLUNTEER
===================================================== */

export async function deleteVolunteer(req, res) {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findByIdAndDelete(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found.",
      });
    }

    res.json({
      success: true,
      message: "Volunteer application deleted successfully.",
    });
  } catch (error) {
    console.error("Delete volunteer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete volunteer.",
    });
  }
}

export async function getVolunteers(req, res) {
  try {
    const { status, type } = req.query;

    // ==========================================
    // PAGINATION
    // ==========================================

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);

    const skip = (page - 1) * limit;

    // ==========================================
    // SEARCH FILTER
    // ==========================================

    const search = req.query.search?.trim() || "";

    const filter = {};

    // ==========================================
    // CITY FILTER
    // ==========================================

    if (req.query.city?.trim()) {
      filter.city = {
        $regex: req.query.city.trim(),
        $options: "i",
      };
    }

    // ==========================================
    // AREA FILTER
    // ==========================================

    if (req.query.area?.trim()) {
      filter.area = {
        $regex: req.query.area.trim(),
        $options: "i",
      };
    }

    // ==========================================
    // DATE FILTER
    // ==========================================

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};

      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(`${req.query.startDate}T00:00:00`);
      }

      if (req.query.endDate) {
        const endDate = new Date(`${req.query.endDate}T23:59:59.999`);

        filter.createdAt.$lte = endDate;
      }
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          city: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================

    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected"];

      const requestedStatus = status.toLowerCase();

      if (!allowedStatuses.includes(requestedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid volunteer status.",
        });
      }

      filter.status = requestedStatus;
    }

    // ==========================================
    // NEW APPLICATION
    // PENDING + LAST 24 HOURS
    // ==========================================

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (type === "new") {
      filter.status = "pending";

      if (!filter.createdAt) {
        filter.createdAt = {};
      }

      const existingDateFilter = filter.createdAt;

      existingDateFilter.$gte =
        existingDateFilter.$gte && existingDateFilter.$gte > last24Hours
          ? existingDateFilter.$gte
          : last24Hours;
    }

    // ==========================================
    // FETCH DATA + COUNTS
    // ==========================================

    const [
      volunteers,
      total,
      totalVolunteerCount,
      approvedCount,
      rejectedCount,
      pendingCount,
      newApplicationCount,
    ] = await Promise.all([
      // Current page records
      Volunteer.find(filter).select("+passwordHash")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      // Current filter total
      Volunteer.countDocuments(filter),

      // ALL volunteers
      Volunteer.countDocuments({}),

      // APPROVED
      Volunteer.countDocuments({
        status: "approved",
      }),

      // REJECTED
      Volunteer.countDocuments({
        status: "rejected",
      }),

      // PENDING
      Volunteer.countDocuments({
        status: "pending",
      }),

      // NEW APPLICATIONS
      Volunteer.countDocuments({
        status: "pending",
        createdAt: {
          $gte: last24Hours,
        },
      }),
    ]);

    // Never send password hashes to the admin browser; only expose a set/not-set flag.
    const safeVolunteers = volunteers.map(({ passwordHash, ...item }) => ({ ...item, passwordSet: Boolean(passwordHash) }));

    // ==========================================
    // TOTAL PAGES
    // ==========================================

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      count: volunteers.length,

      items: safeVolunteers,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
      },

      counts: {
        total: totalVolunteerCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pending: pendingCount,
        newApplications: newApplicationCount,
      },
    });
  } catch (error) {
    console.error("List volunteers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load volunteers.",
    });
  }
}

/* =====================================================
   BULK IMPORT VOLUNTEERS FROM EXCEL
===================================================== */

export async function bulkCreateVolunteers(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file.",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty.",
      });
    }

    const volunteers = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const name = String(row.name || "").trim();
      const phone = String(row.phone || "").trim();
      const email = String(row.email || "").trim();
      const city = String(row.city || "").trim();
      const area = String(row.area || "").trim();
      const message = String(row.message || "").trim();

      let status = String(
        row.status || "pending"
      )
        .trim()
        .toLowerCase();

      // New -> pending
      if (status === "new") {
        status = "pending";
      }

      // Validate status
      if (
        !["pending", "approved", "rejected"].includes(
          status
        )
      ) {
        status = "pending";
      }

      // Required fields
      if (!name || !phone) {
        errors.push({
          row: i + 2,
          message: "Name and phone are required.",
        });

        continue;
      }

      volunteers.push({
        applicationNo: `VOL-${Date.now()}-${i}`,
        name,
        phone,
        email,
        city,
        area,
        message,
        status,
        // Imported records need a hash because Volunteer.passwordHash is required.
        // A random inaccessible password lets the volunteer set up credentials through the approved-account flow.
        passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12),
      });
    }

    if (!volunteers.length) {
      return res.status(400).json({
        success: false,
        message: "No valid volunteer records found.",
        errors,
      });
    }

    const insertedVolunteers = await Volunteer.insertMany(volunteers);

    // Send one push per imported volunteer so website/admin bulk imports are not silent.
    for (const volunteer of insertedVolunteers) {
      await createAdminNotification({
        eventKey: `volunteer:${volunteer._id}:created`,
        type: "volunteer",
        title: "New volunteer application",
        message: `${volunteer.name} submitted a volunteer application${volunteer.phone ? ` (${volunteer.phone})` : ""}.`,
        entityId: String(volunteer._id),
      });
    }

    return res.status(201).json({
      success: true,
      message: `${insertedVolunteers.length} volunteers imported successfully.`,
      count: insertedVolunteers.length,
      items: insertedVolunteers,
      errors,
    });
  } catch (error) {
    console.error(
      "Bulk volunteer import error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to import volunteers.",
    });
  }
}

/* =====================================================
   BULK UPDATE VOLUNTEER STATUS
===================================================== */

export async function bulkUpdateVolunteerStatus(req, res) {
  try {
    const { ids, status } = req.body || {};

    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one volunteer.",
      });
    }

    if (!allowedStatuses.includes(String(status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid volunteer status.",
      });
    }

    const validIds = [...new Set(ids.map((id) => String(id)))];

    const result = await Volunteer.updateMany(
      { _id: { $in: validIds } },
      { $set: { status: String(status).toLowerCase() } },
      { runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Volunteer statuses updated successfully.",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk volunteer status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update volunteer statuses.",
    });
  }
}