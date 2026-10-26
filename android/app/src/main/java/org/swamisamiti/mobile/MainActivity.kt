package org.swamisamiti.mobile

import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContracts
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MultipartBody
import android.os.Bundle
import android.os.Build
import android.view.Gravity
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ImageView
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import android.text.InputFilter
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.razorpay.Checkout
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import org.json.JSONObject
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity(), PaymentResultWithDataListener {
    private lateinit var root: LinearLayout
    private var activeDrawer: DrawerLayout? = null
    private val prefs by lazy { getSharedPreferences("samiti_session", MODE_PRIVATE) }
    private var phone = ""
    private var token = ""
    private var loading = false
    private var darkMode = false
    private var currentProfilePhotoUrl = ""
    private var currentAdminPhotoUrl = ""
    private var pendingGalleryEditId = ""
    private var pendingActivityImageUri: Uri? = null
    private var pendingGalleryImageUri: Uri? = null
    private var pendingSiteLogoUri: Uri? = null
    private var pendingSitePosterUri: Uri? = null
    private var currentScreenTitle = ""
    private val photoPicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri -> if (uri != null) uploadVolunteerPhoto(uri) }
    private val adminPhotoPicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri -> if (uri != null) uploadAdminPhoto(uri) }
    private val activityImagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri -> if (uri != null) { pendingActivityImageUri = uri; message("Activity image selected.") } }
    private val galleryImagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri -> if (uri != null) { pendingGalleryImageUri = uri; uploadGalleryImage(uri, pendingGalleryEditId) } }
    private val siteLogoPicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri -> if (uri != null) { pendingSiteLogoUri = uri; message("Logo selected. Save Mobile/Website Settings to upload it.") } }
    private val sitePosterPicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri -> if (uri != null) { pendingSitePosterUri = uri; message("Poster selected. Save Mobile/Website Settings to upload it.") } }
    private var pendingDonationId = ""
    private var pendingOrderId = ""
    private var pendingReceiptNo = ""
    private var pendingReceiptText = ""
    private val receiptSaver = registerForActivityResult(ActivityResultContracts.CreateDocument("text/plain")) { uri ->
        if (uri != null) { try { contentResolver.openOutputStream(uri)?.use { it.write(pendingReceiptText.toByteArray(Charsets.UTF_8)) }; message("Receipt saved successfully.") } catch (e: Exception) { message("Could not save receipt: ${e.localizedMessage}") } }
    }

    private var navy = Color.rgb(20, 35, 54)
    private var navy2 = Color.rgb(30, 49, 72)
    private var saffron = Color.rgb(232, 133, 37)
    private val canvas = Color.rgb(246, 248, 251)
    private val ink = Color.rgb(30, 41, 59)
    private val muted = Color.rgb(100, 116, 139)
    private val green = Color.rgb(22, 140, 90)
    private val red = Color.rgb(190, 55, 55)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Let Android place the app below the status/navigation bars to prevent header overlap.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = navy
        window.navigationBarColor = canvas
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
        darkMode = prefs.getBoolean("darkMode", false)
        navy = prefs.getInt("themeNavy", Color.rgb(20, 35, 54))
        navy2 = prefs.getInt("themeNavy2", Color.rgb(30, 49, 72))
        saffron = prefs.getInt("themeAccent", Color.rgb(232, 133, 37))
        token = prefs.getString("token", "") ?: ""
        if (token.isNotBlank()) showRoleHome(prefs.getString("role", "user") ?: "user") else showWelcome()
    }

    @Deprecated("Use system back dispatcher")
    override fun onBackPressed() {
        val drawer = activeDrawer
        if (drawer?.isDrawerOpen(Gravity.START) == true) { drawer.closeDrawer(Gravity.START); return }
        val role = prefs.getString("role", "user") ?: "user"
        if (token.isNotBlank() && !currentScreenTitle.contains("Dashboard", true) && !currentScreenTitle.contains("Welcome", true)) {
            showRoleHome(role); return
        }
        if (token.isNotBlank()) { showRoleHome(role); return }
        showWelcome()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun setup(title: String, showLogout: Boolean = false) {
        currentScreenTitle = title
        val drawer = DrawerLayout(this).apply { setBackgroundColor(if (darkMode) Color.rgb(15, 23, 42) else canvas) }
        activeDrawer = drawer
        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(if (darkMode) Color.rgb(15, 23, 42) else canvas)
        }
        val top = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            // decorFitsSystemWindows=true already applies the status-bar inset; do not add it twice.
            setPadding(dp(10), dp(8), dp(10), dp(8))
            setBackgroundColor(navy)
        }
        if (showLogout) {
            top.addView(TextView(this).apply {
                text = "☰"; textSize = 27f; gravity = Gravity.CENTER
                setTextColor(Color.WHITE); contentDescription = "Open navigation menu"
                setOnClickListener { activeDrawer?.openDrawer(Gravity.START) }
                layoutParams = LinearLayout.LayoutParams(dp(42), dp(48))
            })
        }
        val brand = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, -2, 1f)
        }
        val logo = ImageView(this).apply {
            setImageResource(R.drawable.samiti_logo)
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40)).apply { rightMargin = dp(8) }
            contentDescription = "Swami Vivekanand Samiti logo"
        }
        brand.addView(logo)
        val brandText = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; layoutParams = LinearLayout.LayoutParams(0, -2, 1f) }
        brandText.addView(TextView(this).apply {
            text = "SWAMI VIVEKANAND SAMITI"
            textSize = 10f; maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END
            letterSpacing = .035f; setTextColor(Color.rgb(255, 202, 139)); setTypeface(typeface, Typeface.BOLD)
        })
        brandText.addView(TextView(this).apply {
            text = title; textSize = 18f; maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            setTextColor(Color.WHITE); setTypeface(typeface, Typeface.BOLD)
        })
        brand.addView(brandText)
        top.addView(brand)
        if (showLogout) {
            top.addView(TextView(this).apply {
                text = if (darkMode) "☀ Light" else "☾ Dark"; textSize = 12f; gravity = Gravity.CENTER
                setTextColor(Color.WHITE); setPadding(dp(9), dp(10), dp(9), dp(10))
                background = android.graphics.drawable.GradientDrawable().apply {
                    cornerRadius = dp(10).toFloat(); setColor(navy2)
                }
                contentDescription = "Toggle dark mode"
                setOnClickListener { darkMode = !darkMode; prefs.edit().putBoolean("darkMode", darkMode).apply(); showRoleHome(prefs.getString("role", "volunteer") ?: "volunteer") }
            })
        }
        page.addView(top)
        val scroll = ScrollView(this).apply { isFillViewport = true; clipToPadding = false; overScrollMode = View.OVER_SCROLL_IF_CONTENT_SCROLLS }
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            // Leave space for gesture navigation / Android bottom navigation bar.
            val navRes = resources.getIdentifier("navigation_bar_height", "dimen", "android")
            val navHeight = if (navRes > 0) resources.getDimensionPixelSize(navRes) else dp(24)
            setPadding(dp(14), dp(12), dp(14), navHeight + dp(16))
            setBackgroundColor(if (darkMode) Color.rgb(15, 23, 42) else canvas)
        }
        scroll.addView(root)
        page.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        drawer.addView(page, DrawerLayout.LayoutParams(-1, -1))
        var drawerNav: LinearLayout? = null
        if (showLogout) {
            val nav = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundColor(if (darkMode) Color.rgb(15, 23, 42) else Color.WHITE)
                setPadding(dp(16), dp(12), dp(16), dp(12))
            }
            drawerNav = nav
            val navScroll = ScrollView(this).apply { isFillViewport = false; clipToPadding = false }
            val navContent = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
            navScroll.addView(navContent)
            nav.addView(navScroll, LinearLayout.LayoutParams(-1, 0, 1f))
            val menuContainer = navContent
            menuContainer.addView(ImageView(this).apply {
                scaleType = ImageView.ScaleType.CENTER_CROP
                layoutParams = LinearLayout.LayoutParams(dp(76), dp(76)).apply { bottomMargin = dp(10) }
                val savedPhoto = prefs.getString("photoUrl", "") ?: ""
                if (savedPhoto.isNotBlank()) com.bumptech.glide.Glide.with(this@MainActivity).load(savedPhoto).placeholder(R.drawable.samiti_logo).error(R.drawable.samiti_logo).into(this)
                else setImageResource(R.drawable.samiti_logo)
                contentDescription = "Profile photo"
            })
            menuContainer.addView(TextView(this).apply {
                text = (prefs.getString("displayName", "") ?: "").ifBlank { if ((prefs.getString("role", "user") ?: "user").equals("admin", true)) "Administrator" else "Volunteer" }
                textSize = 16f; setTextColor(if (darkMode) Color.WHITE else navy); setTypeface(typeface, Typeface.BOLD); setPadding(0, dp(2), 0, dp(2))
            })
            menuContainer.addView(TextView(this).apply {
                text = prefs.getString("phone", "") ?: ""
                textSize = 12f; setTextColor(muted); setPadding(0, 0, 0, dp(12))
            })
            fun navItem(label: String, emoji: String, action: () -> Unit) {
                val item = TextView(this).apply {
                    text = "$emoji   $label"; textSize = 15f; setTextColor(if (darkMode) Color.WHITE else ink)
                    gravity = Gravity.CENTER_VERTICAL; setPadding(dp(12), 0, dp(8), 0)
                    background = android.graphics.drawable.GradientDrawable().apply { cornerRadius = dp(10).toFloat(); setColor(if (darkMode) Color.rgb(30,41,59) else Color.rgb(246,248,251)) }
                    layoutParams = LinearLayout.LayoutParams(-1, dp(48)).apply { bottomMargin = dp(7) }
                    setOnClickListener { drawer.closeDrawer(Gravity.START); action() }
                }
                menuContainer.addView(item)
            }
            val admin = (prefs.getString("role", "user") ?: "user").equals("admin", true) || (prefs.getString("role", "user") ?: "user").equals("superadmin", true)
            navItem("Dashboard", "⌂") { showRoleHome(prefs.getString("role", "user") ?: "user") }
            navItem("Make a Donation", "♥") { showDonateScreen() }
            navItem("Activities & Events", "▦") { loadActivities() }
            navItem("Gallery", "▧") { loadGallery(admin) }
            if (admin) {
                navItem("Volunteers", "♙") { loadVolunteers() }
                navItem("Donations & Finance", "₹") { loadDonations() }
                navItem("Mobile App Settings", "▣") { loadMobileAppSettings() }
                navItem("Admin Profile", "◉") { loadAdminProfile() }
            } else {
                navItem("My Donations", "₹") { loadMyDonations() }
                navItem("Website Information", "ℹ") { loadSettings(false) }
                navItem("Privacy Policy", "▤") { loadPrivacyPolicy() }
            }
            navItem("Change Password", "🔒") { showChangePassword() }
            navItem("My Profile", "◉") { if (admin) loadAdminProfile() else loadMyVolunteerProfile() }
            val screenWidth = resources.displayMetrics.widthPixels
            val drawerWidth = minOf(dp(320), screenWidth - dp(40)).coerceAtLeast(dp(260))
            drawer.addView(nav, DrawerLayout.LayoutParams(drawerWidth, -1, Gravity.START))
            val logoutButton = TextView(this).apply {
                text = "⇥   Logout"; textSize = 15f; gravity = Gravity.CENTER_VERTICAL
                setTextColor(if (darkMode) Color.WHITE else ink); setPadding(dp(12), 0, dp(8), 0)
                background = android.graphics.drawable.GradientDrawable().apply { cornerRadius = dp(10).toFloat(); setColor(if (darkMode) Color.rgb(30,41,59) else Color.rgb(246,248,251)) }
                layoutParams = LinearLayout.LayoutParams(-1, dp(50)).apply { topMargin = dp(8) }
                setOnClickListener { logout() }
            }
            nav.addView(logoutButton)
        }
        // Edge-to-edge: explicitly keep header, content and drawer clear of system bars.
        ViewCompat.setOnApplyWindowInsetsListener(drawer) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            top.setPadding(dp(10), dp(8) + bars.top, dp(10), dp(8))
            root.setPadding(dp(14), dp(12), dp(14), bars.bottom + dp(20))
            if (showLogout) {
                drawerNav?.setPadding(dp(16), bars.top + dp(12), dp(16), bars.bottom + dp(12))
            }
            insets
        }
        setContentView(drawer)
        ViewCompat.requestApplyInsets(drawer)
    }

    private fun heading(value: String, size: Float = 23f) {
        root.addView(TextView(this).apply {
            text = value; textSize = size; setTextColor(if (darkMode) Color.WHITE else ink); setTypeface(typeface, Typeface.BOLD)
            setPadding(0, dp(4), 0, dp(5))
        })
    }

    private fun paragraph(value: String, size: Float = 14f, color: Int = muted) {
        root.addView(TextView(this).apply {
            text = value; textSize = size; setTextColor(color); setLineSpacing(dp(2).toFloat(), 1f)
            setPadding(0, dp(3), 0, dp(8))
        })
    }

    private fun gap(height: Int = 12) {
        root.addView(View(this), LinearLayout.LayoutParams(1, dp(height)))
    }

    private fun card(): LinearLayout {
        val shell = MaterialCardView(this).apply {
            radius = dp(18).toFloat()
            cardElevation = dp(2).toFloat()
            strokeWidth = dp(1)
            strokeColor = if (darkMode) Color.rgb(51, 65, 85) else Color.rgb(228, 233, 240)
            setCardBackgroundColor(if (darkMode) Color.rgb(30, 41, 59) else Color.WHITE)
            useCompatPadding = false
            layoutParams = LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(12) }
        }
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(15), dp(16), dp(15))
        }
        shell.addView(content)
        root.addView(shell)
        return content
    }

    private fun actionButton(label: String, action: () -> Unit) {
        actionButton(label, action, navy)
    }

    private fun actionButton(label: String, action: () -> Unit, color: Int) {
        val b = MaterialButton(this).apply {
            text = label
            isAllCaps = false
            textSize = 14f
            cornerRadius = dp(12)
            setTextColor(Color.WHITE)
            backgroundTintList = android.content.res.ColorStateList.valueOf(color)
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(-1, dp(50)).apply { topMargin = dp(7) }
        }
        root.addView(b)
    }

    private fun cardButton(parent: LinearLayout, label: String, action: () -> Unit, color: Int = navy) {
        parent.addView(MaterialButton(this).apply {
            text = label; isAllCaps = false; textSize = 13f; cornerRadius = dp(11)
            setTextColor(Color.WHITE)
            backgroundTintList = android.content.res.ColorStateList.valueOf(color)
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(-1, dp(46)).apply { topMargin = dp(6) }
        })
    }

    private fun input(hint: String, password: Boolean = false, mobile: Boolean = false, otp: Boolean = false): EditText {
        val e = EditText(this).apply {
            this.hint = hint
            textSize = 15f
            setSingleLine(true)
            if (otp) {
                filters = arrayOf(InputFilter.LengthFilter(6), InputFilter { source, start, end, _, _, _ ->
                    val filtered = source.subSequence(start, end).filter { it.isDigit() }
                    if (filtered.length == end - start) null else filtered
                })
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
                    setAutofillHints("smsOTPCode")
                }
            } else if (mobile) {
                filters = arrayOf(InputFilter.LengthFilter(13))
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
                    setAutofillHints("phone")
                }
            }
            setTextColor(ink)
            setHintTextColor(muted)
            setPadding(dp(14), 0, dp(14), 0)
            background = getDrawable(android.R.drawable.edit_text)
            layoutParams = LinearLayout.LayoutParams(-1, dp(54)).apply { bottomMargin = dp(10) }
        }
        if (password) {
            e.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            addPasswordVisibilityToggle(e)
        } else if (otp) e.inputType = 2 else if (mobile) e.inputType = 3
        root.addView(e)
        return e
    }

    // Adds a tappable eye-style icon inside password fields without changing the existing layout.
    private fun addPasswordVisibilityToggle(field: EditText) {
        val eye = getDrawable(android.R.drawable.ic_menu_view)
        field.setCompoundDrawablesWithIntrinsicBounds(null, null, eye, null)
        field.compoundDrawablePadding = dp(8)
        field.setOnTouchListener { _, event ->
            if (event.action == android.view.MotionEvent.ACTION_UP) {
                val drawable = field.compoundDrawables[2]
                if (drawable != null && event.x >= field.width - field.paddingRight - drawable.bounds.width() - dp(12)) {
                    val start = field.selectionStart
                    val end = field.selectionEnd
                    val isVisible = (field.inputType and android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD) == android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                    field.inputType = if (isVisible) {
                        android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                    } else {
                        android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                    }
                    field.setCompoundDrawablesWithIntrinsicBounds(null, null, getDrawable(android.R.drawable.ic_menu_view), null)
                    field.setSelection(start.coerceAtLeast(0).coerceAtMost(field.text?.length ?: 0), end.coerceAtLeast(0).coerceAtMost(field.text?.length ?: 0))
                    field.performClick()
                    return@setOnTouchListener true
                }
            }
            false
        }
    }

    // Registration-only field styling; the shared input helper stays unchanged for other screens.
    private fun styleRegistrationField(field: EditText) {
        field.background = android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.RECTANGLE
            cornerRadius = dp(12).toFloat()
            setColor(if (darkMode) Color.rgb(30, 41, 59) else Color.WHITE)
            setStroke(dp(1), if (darkMode) Color.rgb(71, 85, 105) else Color.rgb(220, 226, 235))
        }
        field.setTextColor(if (darkMode) Color.WHITE else ink)
        field.setHintTextColor(muted)
        field.setPadding(dp(16), 0, dp(16), 0)
        field.layoutParams = (field.layoutParams as? LinearLayout.LayoutParams
            ?: LinearLayout.LayoutParams(-1, dp(56))).apply {
            height = dp(56)
            bottomMargin = dp(12)
        }
    }

    private fun message(s: String) = Toast.makeText(this, s, Toast.LENGTH_LONG).show()

    private fun networkErrorMessage(error: Throwable, fallback: String = "Something went wrong. Please try again."): String {
        var cause: Throwable? = error
        while (cause != null) {
            when (cause) {
                is java.net.UnknownHostException,
                is java.net.ConnectException,
                is java.net.SocketTimeoutException,
                is java.net.SocketException,
                is java.io.IOException -> return "Network error. Please check your internet connection and try again."
            }
            cause = cause.cause
        }
        return error.localizedMessage?.takeIf { it.isNotBlank() } ?: fallback
    }
    private fun showWelcome() {
        setup("Seva • Sanskar • Samarpan")

        // Minimal entry screen: keep only login and account creation.
        val hero = card()
        hero.setPadding(dp(18), dp(22), dp(18), dp(22))
        hero.addView(ImageView(this).apply {
            setImageResource(R.drawable.samiti_logo)
            contentDescription = "Swami Vivekanand Samiti logo"
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(dp(100), dp(100)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                bottomMargin = dp(14)
            }
        })
        hero.addView(TextView(this).apply {
            text = "Your Samiti, on your mobile"
            textSize = 22f
            gravity = Gravity.CENTER
            setTextColor(navy)
            setTypeface(typeface, Typeface.BOLD)
            setPadding(dp(6), dp(4), dp(6), dp(8))
        })
        hero.addView(TextView(this).apply {
            text = "Swami Vivekanand Vichar Prachar Seva Samiti"
            textSize = 14f
            gravity = Gravity.CENTER
            setTextColor(muted)
            setPadding(dp(6), 0, dp(6), dp(4))
        })

        gap(14)
        actionButton("Login with Mobile Number", { showPhoneLogin(false) }, navy)
        root.addView(TextView(this).apply {
            text = "Create Volunteer Account"
            textSize = 14f
            gravity = Gravity.CENTER
            setTextColor(saffron)
            setTypeface(typeface, Typeface.BOLD)
            setPadding(dp(8), dp(14), dp(8), dp(14))
            isClickable = true
            isFocusable = true
            setOnClickListener { showPhoneLogin(true) }
            contentDescription = "Create a new volunteer account"
        })
        root.addView(TextView(this).apply {
            text = getAppVersion()
            textSize = 12f
            setTextColor(Color.GRAY)
            gravity = Gravity.CENTER
            setPadding(8, dp(16), 8, dp(8))
            layoutParams = LinearLayout.LayoutParams(
                -1,
                -2
            )
        })
    }

    private fun showPhoneLogin(register: Boolean) {
        setup(if (register) "Create Volunteer Account" else "Volunteer Login")
        heading(if (register) "Volunteer application" else "Login with mobile number", 22f)
        paragraph(if (register) "Your application must be approved by an administrator before you can sign in. Pending and rejected applications cannot log in." else "Volunteers must be approved. Admins can sign in on this same screen using their registered admin mobile number and password.")
        val name = if (register) input("Full name").also { styleRegistrationField(it) } else null
        val mobile = input("Mobile number", mobile = true).also { if (register) styleRegistrationField(it) }
        val password = input("Password (minimum 8 characters)", password = true).also { if (register) styleRegistrationField(it) }
        val email = if (register) input("Email address (required)").also { styleRegistrationField(it) } else null
        val city = if (register) input("City / District").also { styleRegistrationField(it) } else null
        val areaOptions = listOf("Choose area of interest", "Education", "Youth Awareness / Yuva Jagran", "Social Service", "Event Management", "Digital Work", "Community Support", "Other")
        val area = if (register) android.widget.Spinner(this).apply {
            val areaAdapter = object : android.widget.ArrayAdapter<String>(this@MainActivity, android.R.layout.simple_spinner_item, areaOptions) {
                override fun getView(position: Int, convertView: View?, parent: android.view.ViewGroup): View {
                    return (super.getView(position, convertView, parent) as TextView).apply {
                        textSize = 15f
                        setTextColor(if (darkMode) Color.WHITE else ink)
                        setPadding(dp(16), 0, dp(12), 0)
                    }
                }
                override fun getDropDownView(position: Int, convertView: View?, parent: android.view.ViewGroup): View {
                    return (super.getDropDownView(position, convertView, parent) as TextView).apply {
                        textSize = 15f
                        setTextColor(ink)
                        setBackgroundColor(Color.WHITE)
                        setPadding(dp(16), dp(12), dp(16), dp(12))
                    }
                }
            }
            areaAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            adapter = areaAdapter
            background = android.graphics.drawable.GradientDrawable().apply {
                cornerRadius = dp(12).toFloat()
                setColor(if (darkMode) Color.rgb(30, 41, 59) else Color.WHITE)
                setStroke(dp(1), if (darkMode) Color.rgb(71, 85, 105) else Color.rgb(220, 226, 235))
            }
            layoutParams = LinearLayout.LayoutParams(-1, dp(56)).apply { bottomMargin = dp(12) }
            root.addView(this)
        } else null
        val note = if (register) input("Message / availability (optional)").also { styleRegistrationField(it) } else null
        actionButton(if (register) "Submit Application" else "Login") {
            val phoneValue = mobile.text.toString().trim()
            val passwordValue = password.text.toString()
            val digitsOnly = phoneValue.filter { it.isDigit() }
            if (digitsOnly.length != 10 || (register && !digitsOnly.firstOrNull().let { it != null && it in '6'..'9' }) || passwordValue.length < 8) {
                message(if (register) "Enter a valid 10-digit Indian mobile number and a password of at least 8 characters." else "Enter the 10-digit mobile number registered to your account and your password.")
                return@actionButton
            }
            if (register && !android.util.Patterns.EMAIL_ADDRESS.matcher(email?.text?.toString()?.trim().orEmpty()).matches()) { message("Please enter a valid email address."); return@actionButton }
            if (register && (area?.selectedItemPosition ?: 0) == 0) { message("Please select an area of interest."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    if (register) {
                        val request = VolunteerRegisterRequest(name?.text?.toString()?.trim().orEmpty(), phoneValue, passwordValue, email?.text?.toString()?.trim().orEmpty(), city?.text?.toString()?.trim().orEmpty(), area?.selectedItem?.toString()?.takeIf { it != areaOptions.first() }.orEmpty(), note?.text?.toString()?.trim().orEmpty())
                        val r = ApiClient.service.registerVolunteerAccount(request)
                        val body = r.body()
                        if (r.isSuccessful && body?.success == true) { message(body.message ?: "Application submitted. Sign in after admin approval."); showWelcome() }
                        else message(body?.message ?: "Application could not be submitted.")
                    } else {
                        // Normalize the phone number before sending either login request.
                        val normalizedPhone = digitsOnly

                        // First try volunteer login. If it fails for any HTTP response,
                        // also try the admin endpoint so a volunteer API error does not
                        // prevent a valid admin account from signing in.
                        val volunteerResponse = ApiClient.service.volunteerLogin(
                            VolunteerLoginRequest(normalizedPhone, passwordValue)
                        )
                        val volunteerBody = volunteerResponse.body()

                        if (
                            volunteerResponse.isSuccessful &&
                            volunteerBody?.success == true &&
                            !volunteerBody.token.isNullOrBlank()
                        ) {
                            token = volunteerBody.token!!
                            val role = volunteerBody.role ?: "volunteer"
                            prefs.edit()
                                .putString("token", token)
                                .putString("role", role)
                                .putString("phone", normalizedPhone)
                                .putString("displayName", volunteerBody.user?.get("name")?.toString().orEmpty())
                                .apply()
                            showRoleHome(role)
                        } else {
                            val adminResponse = ApiClient.service.adminLogin(
                                AdminLoginRequest(normalizedPhone, passwordValue)
                            )
                            val adminBody = adminResponse.body()
                            val adminToken = adminBody?.stringValue("token")

                            if (
                                adminResponse.isSuccessful &&
                                adminBody?.booleanValue("success") == true &&
                                !adminToken.isNullOrBlank()
                            ) {
                                token = adminToken
                                prefs.edit()
                                    .putString("token", token)
                                    .putString("role", "admin")
                                    .putString("phone", normalizedPhone)
                                    .putString(
                                        "displayName",
                                        adminBody.get("admin")
                                            ?.asJsonObjectOrNull()
                                            ?.stringValue("displayName") ?: "Admin"
                                    )
                                    .apply()
                                showRoleHome("admin")
                            } else {
                                val adminMessage = adminBody?.stringValue("message")
                                val volunteerMessage = volunteerBody?.message
                                message(
                                    adminMessage
                                        ?: volunteerMessage
                                        ?: "Login failed. Check the registered mobile number and password."
                                )
                            }
                        }
                    }
                } catch (e: Exception) { message("Could not connect to the server: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }
        if (!register) {
            actionButton("Login with OTP", { showOtpLogin(mobile.text.toString().filter { it.isDigit() }) }, saffron)
            actionButton("Forgot Password?", { showForgotPassword(mobile.text.toString().filter { it.isDigit() }) }, navy2)
        }
        actionButton("Back", { showWelcome() }, navy2)
    }

    // Accept 10 digits, or an Indian number entered with +91 / 91 / leading 0.
    // Always send the normalized 10-digit number to the backend.
    private fun normalizeIndianMobile(value: String): String {
        var digits = value.filter { it.isDigit() }
        if (digits.length == 12 && digits.startsWith("91")) {
            digits = digits.substring(2)
        } else if (digits.length == 11 && digits.startsWith("0")) {
            digits = digits.substring(1)
        }
        return digits
    }

    private fun validIndianMobile(value: String): Boolean =
        normalizeIndianMobile(value).length == 10
    private fun saveOtpSession(body: ApiResult, phoneNumber: String) {
        val authToken = body.token
        if (authToken.isNullOrBlank()) {
            message("Server did not return a login token. Please retry.")
            return
        }
        token = authToken
        val role = body.role?.takeIf { it.isNotBlank() } ?: "volunteer"
        val displayName = if (role.equals("admin", true) || role.equals("superadmin", true)) {
            body.admin?.get("displayName")?.toString()
                ?: body.admin?.get("username")?.toString()
                ?: "Admin"
        } else {
            body.user?.get("name")?.toString() ?: "Volunteer"
        }
        val returnedPhone = if (role.equals("admin", true) || role.equals("superadmin", true)) {
            body.admin?.get("phone")?.toString().orEmpty()
        } else {
            body.user?.get("phone")?.toString().orEmpty()
        }
        prefs.edit()
            .putString("token", token)
            .putString("role", role)
            .putString("phone", returnedPhone.ifBlank { phoneNumber })
            .putString("displayName", displayName)
            .apply()
        showRoleHome(role)
    }

    private fun showOtpLogin(prefillPhone: String = "") {
        setup("OTP Login")
        heading("Login with OTP", 23f)
        paragraph("Enter your registered mobile number. An SMS OTP will be sent to active admins and approved volunteers.")
        val phoneField = input("10-digit mobile number", mobile = true).apply { setText(prefillPhone) }
        actionButton("Send Login OTP", {
            val number = normalizeIndianMobile(phoneField.text.toString())
            if (!validIndianMobile(number)) { message("Enter a valid 10-digit Indian mobile number."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.sendMobileOtp(OtpSendRequest(number, "login"))
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true) {
                        message(body.message ?: "OTP request processed. Check your SMS.")
                        showOtpVerification(number)
                    } else message(body?.message ?: "Could not request OTP. Please retry.")
                } catch (e: Exception) { message("OTP request failed: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, saffron)
        actionButton("Use Password Instead", { showPhoneLogin(false) }, navy2)
        actionButton("Back", { showWelcome() }, navy2)
    }

    private fun showOtpVerification(phoneNumber: String) {
        setup("Verify OTP")
        heading("Verify your mobile", 23f)
        paragraph("Enter the 6-digit OTP sent to +91 $phoneNumber. OTP expires in 10 minutes.")
        val otpField = input("6-digit OTP", otp = true)
        actionButton("Verify & Login", {
            val code = otpField.text.toString().trim()
            if (code.length != 6 || !code.all { it.isDigit() }) { message("Enter the 6-digit OTP."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.verifyMobileOtp(OtpVerifyRequest(phoneNumber, code))
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true && !body.token.isNullOrBlank()) {
                        saveOtpSession(body, phoneNumber)
                    } else message(body?.message ?: "OTP verification failed. Please retry.")
                } catch (e: Exception) { message("OTP verification failed: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, green)
        actionButton("Resend OTP", {
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.sendMobileOtp(OtpSendRequest(phoneNumber, "login"))
                    val body = response.body()
                    message(if (response.isSuccessful && body?.success == true) (body.message ?: "OTP request processed.") else (body?.message ?: "Could not resend OTP."))
                } catch (e: Exception) { message("Could not resend OTP: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, saffron)
        actionButton("Change Mobile Number", { showOtpLogin(phoneNumber) }, navy2)
    }

    private fun showForgotPassword(prefillPhone: String = "") {
        setup("Forgot Password")
        heading("Reset your password", 23f)
        paragraph("We will send an OTP to the registered mobile number. This works for active admins and approved volunteers.")
        val phoneField = input("Registered 10-digit mobile number", mobile = true).apply { setText(prefillPhone) }
        actionButton("Send Password Reset OTP", {
            val number = normalizeIndianMobile(phoneField.text.toString())
            if (!validIndianMobile(number)) { message("Enter a valid 10-digit Indian mobile number."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.sendMobileOtp(OtpSendRequest(number, "reset-password"))
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true) {
                        message(body.message ?: "If eligible, a reset OTP has been sent.")
                        showResetPassword(number)
                    } else message(body?.message ?: "Could not request reset OTP.")
                } catch (e: Exception) { message("Reset OTP request failed: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, saffron)
        actionButton("Back to Login", { showPhoneLogin(false) }, navy2)
    }

    private fun showResetPassword(phoneNumber: String) {
        setup("Set New Password")
        heading("Create a new password", 23f)
        paragraph("Enter the reset OTP and choose a password with at least 8 characters.")
        val otpField = input("6-digit OTP", otp = true)
        val newPassword = input("New password (minimum 8 characters)", password = true)
        val confirmPassword = input("Confirm new password", password = true)
        actionButton("Verify OTP & Reset Password", {
            val code = otpField.text.toString().trim()
            val nextPassword = newPassword.text.toString()
            if (code.length != 6 || !code.all { it.isDigit() }) { message("Enter the 6-digit OTP."); return@actionButton }
            if (nextPassword.length < 8) { message("New password must contain at least 8 characters."); return@actionButton }
            if (nextPassword != confirmPassword.text.toString()) { message("Passwords do not match."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.resetPasswordWithOtp(PasswordResetRequest(phoneNumber, code, nextPassword))
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true) {
                        message(body.message ?: "Password reset successfully. Please log in.")
                        showPhoneLogin(false)
                    } else message(body?.message ?: "Password reset failed. Check the OTP and retry.")
                } catch (e: Exception) { message("Password reset failed: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, green)
        actionButton("Resend Reset OTP", {
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.sendMobileOtp(OtpSendRequest(phoneNumber, "reset-password"))
                    val body = response.body()
                    message(if (response.isSuccessful && body?.success == true) (body.message ?: "OTP request processed.") else (body?.message ?: "Could not resend OTP."))
                } catch (e: Exception) { message("Could not resend OTP: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, saffron)
        actionButton("Back", { showForgotPassword(phoneNumber) }, navy2)
    }

    private fun showChangePassword() {
        val role = prefs.getString("role", "volunteer") ?: "volunteer"
        val isAdmin = role.equals("admin", true) || role.equals("superadmin", true)
        setup("Change Password", true)
        heading("Change password", 23f)
        paragraph("Confirm your current password before setting a new one.")
        val currentPassword = input("Current password", password = true)
        val newPassword = input("New password (minimum 8 characters)", password = true)
        val confirmPassword = input("Confirm new password", password = true)
        actionButton("Update Password", {
            val oldValue = currentPassword.text.toString()
            val newValue = newPassword.text.toString()
            if (oldValue.isBlank()) { message("Enter your current password."); return@actionButton }
            if (newValue.length < 8) { message("New password must contain at least 8 characters."); return@actionButton }
            if (newValue != confirmPassword.text.toString()) { message("New passwords do not match."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val payload = PasswordChangeRequest(oldValue, newValue)
                    val response = if (isAdmin) ApiClient.service.changeAdminPassword("Bearer $token", payload)
                    else ApiClient.service.changeVolunteerPassword("Bearer $token", payload)
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true) {
                        message(body.message ?: "Password changed successfully.")
                        showRoleHome(role)
                    } else message(body?.message ?: "Password change failed. Check your current password.")
                } catch (e: Exception) { message("Password change failed: ${networkErrorMessage(e, "Please retry.")}") }
                finally { loading = false }
            }
        }, green)
        actionButton("Back to Dashboard", { showRoleHome(role) }, navy2)
    }

    private fun showAdminLogin() {
        setup("Admin Login")
        gap(4)
        val loginCard = card()
        loginCard.setPadding(dp(20), dp(22), dp(20), dp(20))

        val emblem = TextView(this).apply {
            text = "✦"
            textSize = 30f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            background = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.OVAL
                setColor(navy)
            }
            layoutParams = LinearLayout.LayoutParams(dp(64), dp(64)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                bottomMargin = dp(14)
            }
        }
        loginCard.addView(emblem)
        loginCard.addView(TextView(this).apply {
            text = "Welcome, Administrator"
            textSize = 21f
            gravity = Gravity.CENTER
            setTextColor(navy)
            setTypeface(typeface, Typeface.BOLD)
            setPadding(0, 0, 0, dp(6))
        })
        loginCard.addView(TextView(this).apply {
            text = "Sign in securely with your Samiti website admin account."
            textSize = 13f
            gravity = Gravity.CENTER
            setTextColor(muted)
            setLineSpacing(dp(2).toFloat(), 1f)
            setPadding(dp(4), 0, dp(4), dp(18))
        })

        val username = EditText(this).apply {
            hint = "Admin username"
            textSize = 15f
            setSingleLine(true)
            setPadding(dp(14), 0, dp(14), 0)
            background = getDrawable(android.R.drawable.edit_text)
            inputType = 0x00000001
            contentDescription = "Admin username"
            layoutParams = LinearLayout.LayoutParams(-1, dp(54)).apply { bottomMargin = dp(12) }
        }
        val password = EditText(this).apply {
            hint = "Password"
            textSize = 15f
            inputType = 129
            setSingleLine(true)
            setPadding(dp(14), 0, dp(14), 0)
            background = getDrawable(android.R.drawable.edit_text)
            contentDescription = "Admin password"
            layoutParams = LinearLayout.LayoutParams(-1, dp(54)).apply { bottomMargin = dp(4) }
        }
        addPasswordVisibilityToggle(password)
        loginCard.addView(username)
        loginCard.addView(password)
        lateinit var loginButton: MaterialButton
        loginButton = MaterialButton(this).apply {
            text = "Sign in to Admin Panel"
            isAllCaps = false
            textSize = 15f
            cornerRadius = dp(12)
            backgroundTintList = android.content.res.ColorStateList.valueOf(saffron)
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(14) }
            setOnClickListener {
                if (username.text.isNullOrBlank() || password.text.isNullOrBlank()) {
                    message("Enter your username and password.")
                    return@setOnClickListener
                }
                if (loading) return@setOnClickListener
                loading = true
                loginButton.isEnabled = false
                lifecycleScope.launch {
                    try {
                        val r = ApiClient.service.adminLogin(AdminLoginRequest(username.text.toString().trim(), password.text.toString()))
                        val body = r.body()
                        val authToken = body?.stringValue("token")
                        if (r.isSuccessful && body?.booleanValue("success") == true && !authToken.isNullOrBlank()) {
                            token = authToken
                            prefs.edit().putString("token", token).putString("role", "admin").apply()
                            showRoleHome("admin")
                        } else message(body?.stringValue("message") ?: "Admin login failed. Please check your credentials.")
                    } catch (e: Exception) {
                        message("Could not connect to the server: ${networkErrorMessage(e)}")
                    } finally {
                        loading = false
                        loginButton.isEnabled = true
                    }
                }
            }
        }
        loginCard.addView(loginButton)
        paragraph("Protected access • Existing website admin credentials", 11f, muted)
        actionButton("Back", { showWelcome() }, navy2)
    }

    private fun showRoleHome(role: String) {
        val isAdmin = role.equals("admin", true) || role.equals("superadmin", true)
        setup(if (isAdmin) "Admin Dashboard" else "Member Dashboard", showLogout = true)
        heading(if (isAdmin) "Welcome back, Admin 👋" else "Namaste 🙏", 23f)
        paragraph(if (isAdmin) "Manage your Samiti website modules from your phone." else "View the latest Samiti information and member services.")
        if (isAdmin) {
            moduleCard("❤️", "Make a Donation", "Support the Samiti through the secure donation flow.") { showDonateScreen() }
            moduleCard("👥", "Volunteers", "Manage applications, approval status, and records.") { loadVolunteers() }
            moduleCard("🖼️", "Gallery", "View website gallery records and delete supported items.") { loadGallery(true) }
            moduleCard("📅", "Activities & Events", "Website par published activities aur event details.") { loadActivities() }
            moduleCard("📱", "Mobile App Settings", "Theme, mobile branding and app display settings.") { loadMobileAppSettings() }
            moduleCard("₹", "Donations & Finance", "Donation records returned by the admin API.") { loadDonations() }
            moduleCard("👤", "Admin Profile", "Website admin account details.") { loadAdminProfile() }
        } else {
            moduleCard("❤️", "Make a Donation", "Contribute securely using the existing donation backend.") { showDonateScreen() }
            moduleCard("📅", "Activities & Events", "View published Samiti activities.") { loadActivities() }
            moduleCard("🖼️", "Gallery", "Samiti ki photos aur gallery details.") { loadGallery(false) }
            moduleCard("ℹ️", "Website Information", "View the public website content, branding and contact information.") { loadSettings(false) }
            moduleCard("👤", "My Volunteer Profile", "View your details and application status.") { loadMyVolunteerProfile() }
            moduleCard("₹", "My Donation History", "View your paid donations and receipts.") { loadMyDonations() }
            moduleCard("🔒", "Privacy Policy", "Read the Samiti privacy policy.") { loadPrivacyPolicy() }
        }
        paragraph("The app uses the existing website backend. The app will not show a fake success message for operations that are not supported by the backend.", 12f)
    }

    private fun moduleCard(icon: String, title: String, description: String, action: () -> Unit) {
        val c = card()
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val badge = TextView(this).apply {
            text = icon; textSize = 22f; gravity = Gravity.CENTER; setTextColor(saffron)
            setBackgroundColor(Color.rgb(255, 244, 229)); layoutParams = LinearLayout.LayoutParams(dp(48), dp(48))
        }
        row.addView(badge)
        val copy = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(12), 0, 0, 0); layoutParams = LinearLayout.LayoutParams(0, -2, 1f) }
        copy.addView(TextView(this).apply { text = title; textSize = 16f; setTextColor(navy); setTypeface(typeface, Typeface.BOLD); maxLines = 2 })
        copy.addView(TextView(this).apply { text = description; textSize = 13f; setTextColor(muted); setPadding(0, dp(3), 0, 0); setLineSpacing(dp(2).toFloat(), 1f) })
        row.addView(copy); c.addView(row)
        c.addView(MaterialButton(this).apply {
            text = "Open $title"; isAllCaps = false; textSize = 13f; cornerRadius = dp(11)
            backgroundTintList = android.content.res.ColorStateList.valueOf(navy2); setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(-1, dp(44)).apply { topMargin = dp(12) }
            setOnClickListener { action() }
        })
    }

    private fun showVolunteerForm() {
        setup("Volunteer Application")
        heading("Join the Samiti")
        paragraph("Submit a volunteer application. This uses the existing public website endpoint.")
        val name = input("Full name")
        val phoneInput = input("Mobile number", mobile = true)
        val email = input("Email (optional)")
        val city = input("City")
        val area = input("Area / interest")
        val note = input("Message (optional)")
        actionButton("Submit application") {
            if (name.text.isNullOrBlank() || phoneInput.text.isNullOrBlank()) { message("Name aur mobile number required hain."); return@actionButton }
            val payload = JsonObject().apply {
                addProperty("name", name.text.toString().trim())
                addProperty("phone", phoneInput.text.toString().trim())
                addProperty("email", email.text.toString().trim())
                addProperty("city", city.text.toString().trim())
                addProperty("area", area.text.toString().trim())
                addProperty("message", note.text.toString().trim())
            }
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.createVolunteer(payload)
                    val body = response.body()
                    if (response.isSuccessful && body?.booleanValue("success") == true) {
                        message(body.stringValue("message") ?: "Application submitted.")
                        showRoleHome("user")
                    } else message(body?.stringValue("message") ?: "Application could not be submitted.")
                } catch (e: Exception) { message("Request failed: ${networkErrorMessage(e)}") }
            }
        }
        actionButton("Back to Dashboard", { showRoleHome(prefs.getString("role", "user") ?: "user") }, navy2)
    }

    private fun loadVolunteers(
        searchTerm: String = "",
        statusFilter: String = "All",
        cityFilter: String = "",
        areaFilter: String = "",
        dateFrom: String = "",
        dateTo: String = ""
    ) {
        request("Loading volunteers…", { ApiClient.service.volunteers("Bearer $token", page = 1, limit = 500) }) { body ->
            val allRows = body.arrayValue("items", "volunteers", "data")
            val query = searchTerm.trim().lowercase()
            val cityQuery = cityFilter.trim().lowercase()
            val areaQuery = areaFilter.trim().lowercase()
            fun normalizedDate(value: String?): String {
                if (value.isNullOrBlank()) return ""
                val v = value.trim()
                // ISO timestamps and YYYY-MM-DD values can be compared safely as date strings.
                val iso = Regex("\\d{4}-\\d{2}-\\d{2}").find(v)?.value
                if (iso != null) return iso
                val dmy = Regex("\\d{2}/\\d{2}/\\d{4}").find(v)?.value
                if (dmy != null) {
                    val parts = dmy.split('/')
                    return "${parts[2]}-${parts[0]}-${parts[1]}"
                }
                return ""
            }
            val rows = allRows.filter { element ->
                val v = element.asJsonObjectOrNull() ?: return@filter false
                val name = v.stringValue("name") ?: v.stringValue("fullName") ?: ""
                val phoneValue = v.stringValue("phone") ?: v.stringValue("mobile") ?: ""
                val city = v.stringValue("city") ?: v.stringValue("district") ?: ""
                val area = v.stringValue("area") ?: v.stringValue("interest") ?: v.stringValue("areaOfInterest") ?: ""
                val status = (v.stringValue("status") ?: "pending").lowercase()
                val rawDate = v.stringValue("createdAt") ?: v.stringValue("created_at") ?: v.stringValue("applicationDate") ?: v.stringValue("date") ?: ""
                val rowDate = normalizedDate(rawDate)
                val statusMatches = when (statusFilter.lowercase()) {
                    "new", "pending" -> status == "pending" || status == "new"
                    "approved" -> status == "approved"
                    "rejected" -> status == "rejected"
                    else -> true
                }
                (query.isBlank() || name.lowercase().contains(query) || phoneValue.contains(query)) &&
                        (cityQuery.isBlank() || city.lowercase().contains(cityQuery)) &&
                        (areaQuery.isBlank() || area.lowercase().contains(areaQuery)) &&
                        statusMatches &&
                        (dateFrom.isBlank() || (rowDate.isNotBlank() && rowDate >= dateFrom)) &&
                        (dateTo.isBlank() || (rowDate.isNotBlank() && rowDate <= dateTo))
            }

            setup("Volunteer Applications", true)
            heading("Volunteer Applications")
            paragraph("${rows.size} matching records • ${allRows.size()} loaded")

            val filterCard = card()
            filterCard.addView(TextView(this).apply {
                text = "Search & filters"; textSize = 17f; setTextColor(if (darkMode) Color.WHITE else navy); setTypeface(typeface, Typeface.BOLD)
                setPadding(0, 0, 0, dp(8))
            })
            val search = input("Search name / phone").apply { setText(searchTerm) }
            // input() adds fields to root; move them into the filter card so the controls stay grouped.
            (root.getChildAt(root.childCount - 1) as? View)?.let { root.removeView(it); filterCard.addView(it) }
            val city = input("Search city / district").apply { setText(cityFilter) }
            (root.getChildAt(root.childCount - 1) as? View)?.let { root.removeView(it); filterCard.addView(it) }
            val area = input("Search area of interest").apply { setText(areaFilter) }
            (root.getChildAt(root.childCount - 1) as? View)?.let { root.removeView(it); filterCard.addView(it) }

            fun styledSpinner(options: List<String>, selected: String): android.widget.Spinner {
                val adapter = object : android.widget.ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, options) {
                    private fun style(textView: TextView): TextView = textView.apply {
                        textSize = 15f
                        setTextColor(if (darkMode) Color.WHITE else ink)
                        setPadding(dp(12), dp(8), dp(12), dp(8))
                        background = android.graphics.drawable.GradientDrawable().apply {
                            cornerRadius = dp(10).toFloat()
                            setColor(if (darkMode) Color.rgb(30, 41, 59) else Color.rgb(248, 250, 252))
                            setStroke(dp(1), if (darkMode) Color.rgb(71, 85, 105) else Color.rgb(220, 226, 234))
                        }
                    }
                    override fun getView(position: Int, convertView: View?, parent: android.view.ViewGroup): View = style((convertView as? TextView) ?: TextView(this@MainActivity)).apply { text = getItem(position) ?: "" }
                    override fun getDropDownView(position: Int, convertView: View?, parent: android.view.ViewGroup): View = TextView(this@MainActivity).apply {
                        text = getItem(position) ?: ""; textSize = 15f
                        setTextColor(if (darkMode) Color.WHITE else ink)
                        setPadding(dp(16), dp(13), dp(16), dp(13))
                        setBackgroundColor(if (darkMode) Color.rgb(30, 41, 59) else Color.WHITE)
                    }
                }
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                return android.widget.Spinner(this).apply {
                    this.adapter = adapter
                    val index = options.indexOfFirst { it.equals(selected, true) }
                    setSelection(index.coerceAtLeast(0))
                    layoutParams = LinearLayout.LayoutParams(-1, dp(50)).apply { bottomMargin = dp(8) }
                    background = android.graphics.drawable.GradientDrawable().apply {
                        cornerRadius = dp(10).toFloat()
                        setColor(if (darkMode) Color.rgb(30, 41, 59) else Color.rgb(248, 250, 252))
                        setStroke(dp(1), if (darkMode) Color.rgb(71, 85, 105) else Color.rgb(220, 226, 234))
                    }
                    setPadding(dp(6), 0, dp(8), 0)
                }
            }

            val statusOptions = listOf("All", "New", "Approved", "Rejected")
            val statusSpinner = styledSpinner(statusOptions, statusFilter)
            filterCard.addView(TextView(this).apply { text = "Application status"; textSize = 12f; setTextColor(muted); setPadding(dp(2), 0, 0, dp(4)) })
            filterCard.addView(statusSpinner)

            fun dateButton(label: String, initial: String, onPicked: (String) -> Unit): TextView {
                return TextView(this).apply {
                    text = if (initial.isBlank()) label else initial
                    textSize = 14f; gravity = Gravity.CENTER_VERTICAL
                    setTextColor(if (darkMode) Color.WHITE else ink)
                    setPadding(dp(12), 0, dp(12), 0)
                    background = android.graphics.drawable.GradientDrawable().apply {
                        cornerRadius = dp(10).toFloat()
                        setColor(if (darkMode) Color.rgb(30, 41, 59) else Color.rgb(248, 250, 252))
                        setStroke(dp(1), if (darkMode) Color.rgb(71, 85, 105) else Color.rgb(220, 226, 234))
                    }
                    layoutParams = LinearLayout.LayoutParams(0, dp(48), 1f).apply { rightMargin = dp(6); bottomMargin = dp(8) }
                    setOnClickListener {
                        val cal = java.util.Calendar.getInstance()
                        val existing = Regex("(\\d{4})-(\\d{2})-(\\d{2})").find(initial)
                        if (existing != null) {
                            cal.set(existing.groupValues[1].toInt(), existing.groupValues[2].toInt() - 1, existing.groupValues[3].toInt())
                        }
                        android.app.DatePickerDialog(this@MainActivity, { _, year, month, day ->
                            val value = String.format(java.util.Locale.US, "%04d-%02d-%02d", year, month + 1, day)
                            text = value
                            onPicked(value)
                        }, cal.get(java.util.Calendar.YEAR), cal.get(java.util.Calendar.MONTH), cal.get(java.util.Calendar.DAY_OF_MONTH)).show()
                    }
                }
            }
            var pickedFrom = dateFrom
            var pickedTo = dateTo
            filterCard.addView(TextView(this).apply { text = "Application date range"; textSize = 12f; setTextColor(muted); setPadding(dp(2), 0, 0, dp(4)) })
            val dateRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            dateRow.addView(dateButton("From date", dateFrom) { pickedFrom = it })
            dateRow.addView(dateButton("To date", dateTo) { pickedTo = it })
            filterCard.addView(dateRow)

            // Quick status tabs matching the website admin panel (All / New / Approved / Rejected).
            val statusTabs = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            statusOptions.forEach { tab ->
                statusTabs.addView(MaterialButton(this@MainActivity).apply {
                    text = tab
                    isAllCaps = false
                    textSize = 10f
                    minWidth = 0
                    insetTop = 0
                    insetBottom = 0
                    cornerRadius = dp(9)
                    val selected = tab.equals(statusFilter, true)
                    backgroundTintList = android.content.res.ColorStateList.valueOf(if (selected) saffron else if (darkMode) Color.rgb(51, 65, 85) else Color.rgb(239, 242, 247))
                    setTextColor(if (selected || darkMode) Color.WHITE else navy)
                    layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f).apply { rightMargin = dp(4) }
                    setOnClickListener { loadVolunteers(search.text.toString(), tab, city.text.toString(), area.text.toString(), pickedFrom, pickedTo) }
                })
            }
            filterCard.addView(statusTabs)

            val filterActions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            filterActions.addView(MaterialButton(this@MainActivity).apply {
                text = "Apply filters"; isAllCaps = false; textSize = 13f; cornerRadius = dp(10)
                backgroundTintList = android.content.res.ColorStateList.valueOf(saffron); setTextColor(Color.WHITE)
                layoutParams = LinearLayout.LayoutParams(0, dp(46), 1f).apply { rightMargin = dp(6) }
                setOnClickListener { loadVolunteers(search.text.toString(), statusSpinner.selectedItem?.toString() ?: "All", city.text.toString(), area.text.toString(), pickedFrom, pickedTo) }
            })
            filterActions.addView(MaterialButton(this@MainActivity).apply {
                text = "Reset"; isAllCaps = false; textSize = 13f; cornerRadius = dp(10)
                backgroundTintList = android.content.res.ColorStateList.valueOf(navy2); setTextColor(Color.WHITE)
                layoutParams = LinearLayout.LayoutParams(0, dp(46), 1f)
                setOnClickListener { loadVolunteers() }
            })
            filterCard.addView(filterActions)
            actionButton("Add Volunteer Application", { showVolunteerForm() }, navy2)
            if (rows.isEmpty()) paragraph("No volunteer records match these filters.")
            rows.forEachIndexed { index, item ->
                val obj = item.asJsonObjectOrNull() ?: return@forEachIndexed
                val id = obj.stringValue("_id") ?: obj.stringValue("id") ?: ""
                val name = obj.stringValue("name") ?: obj.stringValue("fullName") ?: "Volunteer ${index + 1}"
                val phoneValue = obj.stringValue("phone") ?: obj.stringValue("mobile") ?: "—"
                val cityValue = obj.stringValue("city") ?: obj.stringValue("district") ?: "City not provided"
                val areaValue = obj.stringValue("area") ?: obj.stringValue("interest") ?: obj.stringValue("areaOfInterest") ?: "Not specified"
                val status = obj.stringValue("status") ?: "pending"
                val dateValue = obj.stringValue("createdAt") ?: obj.stringValue("created_at") ?: obj.stringValue("applicationDate") ?: obj.stringValue("date") ?: ""
                val c = card()
                c.addView(TextView(this).apply { text = name; textSize = 16f; setTextColor(if (darkMode) Color.WHITE else navy); setTypeface(typeface, Typeface.BOLD) })
                c.addView(TextView(this).apply {
                    text = "$phoneValue  •  $cityValue\nArea: $areaValue${if (dateValue.isNotBlank()) "\nDate: $dateValue" else ""}"
                    textSize = 13f; setTextColor(if (darkMode) Color.LTGRAY else muted); setPadding(0, dp(5), 0, dp(8))
                })
                val statusColor = when (status.lowercase()) { "approved" -> green; "rejected" -> red; else -> saffron }
                c.addView(TextView(this).apply {
                    text = "  ${status.uppercase()}  "; textSize = 11f; setTypeface(typeface, Typeface.BOLD); setTextColor(Color.WHITE)
                    background = android.graphics.drawable.GradientDrawable().apply { cornerRadius = dp(14).toFloat(); setColor(statusColor) }
                    setPadding(dp(8), dp(5), dp(8), dp(5))
                    layoutParams = LinearLayout.LayoutParams(-2, -2).apply { bottomMargin = dp(8) }
                })
                if (id.isNotBlank()) {
                    val normalized = status.lowercase()
                    if (normalized != "approved") cardButton(c, "Approve", { updateVolunteer(id, obj, "approved") }, green)
                    if (normalized != "rejected") cardButton(c, "Reject", { updateVolunteer(id, obj, "rejected") }, saffron)
                    cardButton(c, "Delete application", { deleteVolunteer(id) }, red)
                }
            }
            actionButton("Back to Dashboard", { showRoleHome("admin") }, navy2)
        }
    }

    private fun updateVolunteer(id: String, item: JsonObject, status: String) {
        val payload = JsonObject().apply {
            listOf("name", "phone", "email", "city", "area", "message").forEach { key ->
                item.get(key)?.let { add(key, it) }
            }
            addProperty("status", status)
        }
        request("Updating volunteer…", { ApiClient.service.updateVolunteerStatus("Bearer $token", id, payload) }) {
            message("Volunteer marked $status.")
            loadVolunteers()
        }
    }

    private fun deleteVolunteer(id: String) {
        request("Deleting volunteer…", { ApiClient.service.deleteVolunteer("Bearer $token", id) }) {
            message("Volunteer application deleted.")
            loadVolunteers()
        }
    }

    private fun loadGallery(admin: Boolean) {
        request("Loading gallery…", { ApiClient.service.gallery() }) { body ->
            val rows = body.arrayValue("items", "data", "gallery")
            setup("Gallery", admin)
            heading("Gallery")
            paragraph("${rows.size()} website gallery records.")
            if (admin) actionButton("Add Gallery Image", { pendingGalleryEditId = ""; galleryImagePicker.launch("image/*") }, saffron)
            if (rows.size() == 0) paragraph("No gallery images returned.")
            rows.forEachIndexed { index, element ->
                val obj = element.asJsonObjectOrNull() ?: return@forEachIndexed
                val url = obj.stringValue("url") ?: obj.stringValue("image") ?: obj.stringValue("imageUrl") ?: ""
                val title = obj.stringValue("title") ?: obj.stringValue("originalName") ?: "Gallery item ${index + 1}"
                val c = card()
                c.addView(TextView(this).apply { text = title; textSize = 15f; setTextColor(navy); setTypeface(typeface, Typeface.BOLD) })
                if (url.isNotBlank()) {
                    val image = ImageView(this).apply {
                        contentDescription = title
                        scaleType = ImageView.ScaleType.CENTER_CROP
                        background = android.graphics.drawable.GradientDrawable().apply {
                            cornerRadius = dp(12).toFloat()
                            setColor(Color.rgb(238, 242, 247))
                        }
                        layoutParams = LinearLayout.LayoutParams(-1, dp(190)).apply { topMargin = dp(8); bottomMargin = dp(8) }
                    }
                    c.addView(image)
                    com.bumptech.glide.Glide.with(this).load(url).placeholder(android.R.drawable.ic_menu_gallery)
                        .error(android.R.drawable.ic_menu_report_image).into(image)
                    image.setOnClickListener {
                        val full = ImageView(this).apply { scaleType = ImageView.ScaleType.FIT_CENTER; adjustViewBounds = true }
                        com.bumptech.glide.Glide.with(this).load(url).into(full)
                        android.app.AlertDialog.Builder(this).setTitle(title).setView(full).setPositiveButton("Close", null).show()
                    }
                }
                val id = obj.stringValue("_id") ?: ""
                if (admin && id.isNotBlank()) {
                    cardButton(c, "Replace image", { pendingGalleryEditId = id; galleryImagePicker.launch("image/*") }, saffron)
                    cardButton(c, "Delete gallery item", {
                        request("Deleting gallery item…", { ApiClient.service.deleteGallery("Bearer $token", id) }) {
                            message("Gallery item deleted."); loadGallery(true)
                        }
                    }, red)
                }
            }
            actionButton("Back to Dashboard", { showRoleHome(prefs.getString("role", "user") ?: "user") }, navy2)
        }
    }

    private fun loadActivities() {
        request("Loading activities…", { ApiClient.service.activities() }) { body ->
            val rows = body.arrayValue("items", "data", "activities")
            setup("Activities & Events", prefs.getString("role", "user") == "admin")
            heading("Activities & Events")
            paragraph("Published information returned by the existing website API.")
            val isAdmin = (prefs.getString("role", "") ?: "").equals("admin", true) || (prefs.getString("role", "") ?: "").equals("superadmin", true)
            if (isAdmin) actionButton("Add Activity", { activityForm(null) }, saffron)
            if (rows.size() == 0) paragraph("No activities returned.")
            rows.forEachIndexed { index, element ->
                val obj = element.asJsonObjectOrNull() ?: return@forEachIndexed
                val english = obj.getAsJsonObject("en")
                val hindi = obj.getAsJsonObject("hi")
                val title = obj.stringValue("title") ?: obj.stringValue("name") ?: obj.stringValue("activityName") ?: english?.stringValue("title") ?: hindi?.stringValue("title") ?: "Activity ${index + 1}"
                val description = obj.stringValue("description") ?: obj.stringValue("details") ?: obj.stringValue("content") ?: obj.stringValue("summary") ?: obj.stringValue("text") ?: english?.stringValue("shortText") ?: hindi?.stringValue("shortText") ?: english?.stringValue("details") ?: ""
                val c = card()
                c.addView(TextView(this).apply { text = title; textSize = 16f; setTextColor(navy); setTypeface(typeface, Typeface.BOLD); maxLines = 2 })
                if (description.isNotBlank()) c.addView(TextView(this).apply { text = description; textSize = 13f; setTextColor(muted); setPadding(0, dp(5), 0, 0) })
                val imageUrl = obj.stringValue("imageUrl") ?: obj.stringValue("image") ?: obj.stringValue("url") ?: obj.stringValue("photo")
                if (!imageUrl.isNullOrBlank()) {
                    val image = ImageView(this).apply {
                        contentDescription = title
                        scaleType = ImageView.ScaleType.CENTER_CROP
                        layoutParams = LinearLayout.LayoutParams(-1, dp(170)).apply { topMargin = dp(8) }
                    }
                    c.addView(image)
                    com.bumptech.glide.Glide.with(this).load(imageUrl).placeholder(android.R.drawable.ic_menu_gallery)
                        .error(android.R.drawable.ic_menu_report_image).into(image)
                }
                val date = obj.stringValue("date") ?: obj.stringValue("eventDate")
                if (!date.isNullOrBlank()) c.addView(TextView(this).apply { text = date; textSize = 12f; setTextColor(saffron); setPadding(0, dp(5), 0, 0) })
                if (isAdmin) {
                    cardButton(c, "Edit", { activityForm(obj) }, saffron)
                    val no = obj.get("activityNo")?.let { try { it.asInt } catch (_: Exception) { index + 1 } } ?: index + 1
                    cardButton(c, "Delete", { request("Deleting activity…", { ApiClient.service.deleteActivity("Bearer $token", no) }) { message("Activity deleted."); loadActivities() } }, red)
                }
            }
            actionButton("Back to Dashboard", { showRoleHome(prefs.getString("role", "user") ?: "user") }, navy2)
        }
    }

    private fun activityForm(existing: JsonObject?) {
        pendingActivityImageUri = null
        val isEdit = existing != null
        val hi = existing?.getAsJsonObject("hi")
        val en = existing?.getAsJsonObject("en")
        setup(if (isEdit) "Edit Activity" else "Add Activity", true)
        heading(if (isEdit) "Edit Activity" else "Add Activity")
        val no = input("Activity number (1-15)").apply { setText(existing?.get("activityNo")?.toString()?.trim('"') ?: "") ; if (isEdit) isEnabled = false }
        val hiTitle = input("Hindi title").apply { setText(hi?.stringValue("title") ?: "") }
        val hiShort = input("Hindi short text").apply { setText(hi?.stringValue("shortText") ?: "") }
        val hiDetails = input("Hindi details").apply { setText(hi?.stringValue("details") ?: "") }
        val enTitle = input("English title").apply { setText(en?.stringValue("title") ?: "") }
        val enShort = input("English short text").apply { setText(en?.stringValue("shortText") ?: "") }
        val enDetails = input("English details").apply { setText(en?.stringValue("details") ?: "") }
        actionButton("Choose Activity Image") { activityImagePicker.launch("image/*") }
        paragraph("For a new activity, choose an image before saving. Existing activity image can remain unchanged.")
        actionButton("Save Activity", {
            val activityNo = no.text.toString().toIntOrNull()
            if (activityNo == null || activityNo !in 1..15) { message("Activity number must be 1 to 15."); return@actionButton }
            if (listOf(hiTitle, hiShort, hiDetails, enTitle, enShort, enDetails).any { it.text.toString().trim().isBlank() }) { message("Please complete all Hindi and English fields."); return@actionButton }
            if (!isEdit && pendingActivityImageUri == null) { message("Please select an activity image."); return@actionButton }
            lifecycleScope.launch {
                try {
                    val txt = "text/plain".toMediaTypeOrNull()
                    fun field(v: String) = v.toRequestBody(txt)
                    fun imagePart(uri: Uri, key: String): MultipartBody.Part { val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("Could not read image"); val mime = contentResolver.getType(uri) ?: "image/jpeg"; return MultipartBody.Part.createFormData(key, "activity-image.jpg", bytes.toRequestBody(mime.toMediaTypeOrNull())) }
                    val image = pendingActivityImageUri?.let { imagePart(it, "image") }
                    val response = if (isEdit) ApiClient.service.updateActivity("Bearer $token", activityNo, field(hiTitle.text.toString()), field(hiShort.text.toString()), field(hiDetails.text.toString()), field(enTitle.text.toString()), field(enShort.text.toString()), field(enDetails.text.toString()), image)
                    else ApiClient.service.createActivity("Bearer $token", field(activityNo.toString()), field(hiTitle.text.toString()), field(hiShort.text.toString()), field(hiDetails.text.toString()), field(enTitle.text.toString()), field(enShort.text.toString()), field(enDetails.text.toString()), image!!)
                    if (response.isSuccessful) { message("Activity saved successfully."); pendingActivityImageUri = null; loadActivities() } else message(response.errorBody()?.string() ?: "Could not save activity.")
                } catch (e: Exception) { message("Save failed: ${networkErrorMessage(e)}") }
            }
        }, green)
        actionButton("Cancel", { loadActivities() }, navy2)
    }

    private fun uploadGalleryImage(uri: Uri, editId: String) {
        lifecycleScope.launch {
            try {
                val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("Could not read image")
                if (bytes.size > 8 * 1024 * 1024) { message("Choose an image smaller than 8 MB."); return@launch }
                val mime = contentResolver.getType(uri) ?: "image/jpeg"
                val part = MultipartBody.Part.createFormData("photo", "gallery-image.jpg", bytes.toRequestBody(mime.toMediaTypeOrNull()))
                val response = if (editId.isBlank()) ApiClient.service.uploadGallery("Bearer $token", part) else ApiClient.service.updateGallery("Bearer $token", editId, part)
                if (response.isSuccessful) { message(if (editId.isBlank()) "Gallery image added." else "Gallery image updated."); pendingGalleryEditId = ""; pendingGalleryImageUri = null; loadGallery(true) } else message(response.errorBody()?.string() ?: "Gallery upload failed.")
            } catch (e: Exception) { message("Gallery upload failed: ${networkErrorMessage(e)}") }
        }
    }

    private fun loadSettings(admin: Boolean) {
        request("Loading website information…", {
            if (admin) ApiClient.service.adminSiteSettings("Bearer $token") else ApiClient.service.publicSiteSettings()
        }) { body -> renderWebsiteInformation(body, admin) }
    }

    private fun loadPrivacyPolicy() {
        request("Loading privacy policy…", { ApiClient.service.publicSiteSettings() }) { body ->
            val settings = body.get("settings")?.asJsonObjectOrNull() ?: body.get("data")?.asJsonObjectOrNull() ?: body
            val policy = findTextValue(settings, listOf("privacyPolicy", "privacy_policy", "privacy", "privacyText", "policy"))
            setup("Privacy Policy", token.isNotBlank())
            heading("Privacy Policy")
            if (policy.isNullOrBlank()) {
                paragraph("The website API did not return a privacy policy text field. Add the policy content to Website Settings in the backend/admin panel.")
            } else paragraph(policy, 14f, if (darkMode) Color.LTGRAY else ink)
            actionButton("Back to Dashboard", { showRoleHome(prefs.getString("role", "volunteer") ?: "volunteer") }, navy2)
        }
    }

    private fun findTextValue(obj: JsonObject, names: List<String>): String? {
        for (name in names) {
            val value = obj.get(name)
            if (value != null && !value.isJsonNull && value.isJsonPrimitive) {
                val text = try { value.asString } catch (_: Exception) { "" }
                if (text.isNotBlank()) return text
            }
        }
        for ((_, value) in obj.entrySet()) {
            if (value.isJsonObject) findTextValue(value.asJsonObject, names)?.let { return it }
        }
        return null
    }

    private fun renderWebsiteInformation(body: JsonObject, admin: Boolean) {
        setup("Website Information", admin)
        val settings = body.get("settings")?.asJsonObjectOrNull() ?: body.get("data")?.asJsonObjectOrNull() ?: body
        heading(findTextValue(settings, listOf("siteName", "websiteName", "title", "name")) ?: "Swami Vivekanand Vichar Prachar Seva Samiti")
        val logoUrl = findTextValue(settings, listOf("logo", "logoUrl", "siteLogo"))
        if (!logoUrl.isNullOrBlank()) {
            val image = ImageView(this).apply { scaleType = ImageView.ScaleType.FIT_CENTER; layoutParams = LinearLayout.LayoutParams(-1, dp(130)).apply { bottomMargin = dp(10) } }
            root.addView(image)
            com.bumptech.glide.Glide.with(this).load(logoUrl).placeholder(R.drawable.samiti_logo).error(R.drawable.samiti_logo).into(image)
        } else {
            root.addView(ImageView(this).apply { setImageResource(R.drawable.samiti_logo); scaleType = ImageView.ScaleType.FIT_CENTER; layoutParams = LinearLayout.LayoutParams(-1, dp(120)) })
        }
        val description = findTextValue(settings, listOf("description", "about", "aboutUs", "tagline", "intro"))
        if (!description.isNullOrBlank()) paragraph(description, 15f, if (darkMode) Color.LTGRAY else muted)
        val keys = listOf("address", "contactAddress", "phone", "contactPhone", "email", "contactEmail", "website", "facebook", "instagram")
        keys.forEach { key ->
            val value = findTextValue(settings, listOf(key))
            if (!value.isNullOrBlank()) {
                val c = card()
                c.addView(TextView(this).apply { text = prettyLabel(key); textSize = 12f; setTextColor(muted) })
                c.addView(TextView(this).apply { text = value; textSize = 15f; setTextColor(if (darkMode) Color.WHITE else ink); setPadding(0, dp(4), 0, 0) })
            }
        }
        if (description.isNullOrBlank() && logoUrl.isNullOrBlank() && keys.none { !findTextValue(settings, listOf(it)).isNullOrBlank() }) {
            paragraph("The public settings API returned no recognized website content. Check the backend site settings model and API response.")
        }
        actionButton("Preview Activities & Events", { loadActivities() }, saffron)
        actionButton("Preview Website Gallery", { loadGallery(false) }, navy2)
        actionButton("Read Privacy Policy", { loadPrivacyPolicy() }, saffron)
        actionButton("Back to Dashboard", { showRoleHome(prefs.getString("role", "volunteer") ?: "volunteer") }, navy2)
    }

    private fun setThemePalette(primary: Int, secondary: Int, accent: Int) {
        navy = primary; navy2 = secondary; saffron = accent
        prefs.edit().putInt("themeNavy", primary).putInt("themeNavy2", secondary).putInt("themeAccent", accent).apply()
        message("App theme colors updated on this device.")
        loadMobileAppSettings()
    }

    private fun loadMobileAppSettings() {
        request("Loading mobile settings…", { ApiClient.service.adminSiteSettings("Bearer $token") }) { body ->
            val settings = body.getAsJsonObject("item") ?: body.getAsJsonObject("settings") ?: body
            setup("Mobile App Settings", true); heading("Mobile App Settings")
            paragraph("Manage the shared Samiti branding and this phone's display theme. Website logo changes are shared through the backend.")
            actionButton(if (darkMode) "Switch to Light Theme" else "Switch to Dark Theme", { darkMode = !darkMode; prefs.edit().putBoolean("darkMode", darkMode).apply(); loadMobileAppSettings() }, saffron)
            heading("App Theme Colors", 18f)
            actionButton("Navy + Saffron (Default)", { setThemePalette(Color.rgb(20,35,54), Color.rgb(30,49,72), Color.rgb(232,133,37)) }, Color.rgb(30,49,72))
            actionButton("Maroon + Gold", { setThemePalette(Color.rgb(105,24,35), Color.rgb(135,31,42), Color.rgb(232,166,56)) }, Color.rgb(135,31,42))
            actionButton("Green + Gold", { setThemePalette(Color.rgb(20,83,62), Color.rgb(25,105,78), Color.rgb(226,166,52)) }, Color.rgb(25,105,78))
            val name = input("Samiti name (English)").apply { setText(settings.stringValue("nameEn") ?: "Swami Vivekananda Vichar Prachar Seva Samiti") }
            val tagline = input("Tagline").apply { setText(settings.stringValue("taglineEn") ?: "Service • Knowledge • Propagation") }
            val phoneField = input("Contact phone", mobile = true).apply { setText(settings.stringValue("phone") ?: "") }
            val emailField = input("Contact email").apply { setText(settings.stringValue("email") ?: "") }
            val address = input("Address").apply { setText(settings.stringValue("addressEn") ?: "") }
            val intro = input("Contact introduction").apply { setText(settings.stringValue("contactIntroEn") ?: "") }
            val logoUrl = settings.stringValue("logo") ?: ""
            if (logoUrl.isNotBlank()) {
                val image = ImageView(this).apply { scaleType = ImageView.ScaleType.FIT_CENTER; layoutParams = LinearLayout.LayoutParams(dp(110), dp(110)).apply { bottomMargin = dp(8) } }
                root.addView(image); com.bumptech.glide.Glide.with(this).load(logoUrl).placeholder(R.drawable.samiti_logo).into(image)
            }
            actionButton("Choose Samiti Logo") { siteLogoPicker.launch("image/*") }
            actionButton("Choose Website Poster") { sitePosterPicker.launch("image/*") }
            actionButton("Save Branding Settings", {
                lifecycleScope.launch {
                    try {
                        val mime = "text/plain".toMediaTypeOrNull()
                        fun field(v: String) = v.toRequestBody(mime)
                        fun part(uri: Uri?, name: String): MultipartBody.Part? {
                            if (uri == null) return null
                            val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("Could not read selected image")
                            if (bytes.size > 8 * 1024 * 1024) throw IllegalStateException("Images must be smaller than 8 MB")
                            val type = contentResolver.getType(uri) ?: "image/jpeg"
                            return MultipartBody.Part.createFormData(name, "$name-image.jpg", bytes.toRequestBody(type.toMediaTypeOrNull()))
                        }
                        val response = ApiClient.service.updateAdminSiteSettings("Bearer $token", field(name.text.toString()), field(tagline.text.toString()), field(phoneField.text.toString()), field(emailField.text.toString()), field(address.text.toString()), field(intro.text.toString()), part(pendingSiteLogoUri, "logo"), part(pendingSitePosterUri, "poster"))
                        if (response.isSuccessful) { pendingSiteLogoUri = null; pendingSitePosterUri = null; message("Branding settings saved."); loadMobileAppSettings() } else message(response.errorBody()?.string() ?: "Settings update failed.")
                    } catch (e: Exception) { message("Settings update failed: ${networkErrorMessage(e)}") }
                }
            }, green)
            paragraph("Note: Android launcher icon is packaged inside the installed APK. To change the launcher icon itself, app resources must be updated and a new APK installed. In-app logo and light/dark theme can change without reinstalling.", 12f)
            actionButton("Back to Dashboard", { showRoleHome("admin") }, navy2)
        }
    }

    private fun loadMyVolunteerProfile() {
        request("Loading your profile…", { ApiClient.service.myVolunteerProfile("Bearer $token") }) { body ->
            val item = body.getAsJsonObject("item") ?: body
            setup("My Volunteer Profile", true); heading("My Profile", 22f)
            val name = input("Full name"); name.setText(item.stringValue("name") ?: "")
            val email = input("Email"); email.setText(item.stringValue("email") ?: "")
            val city = input("City / District"); city.setText(item.stringValue("city") ?: "")
            val areaOptions = listOf(
                "Choose area of interest",
                "Education",
                "Youth Awareness / Yuva Jagran",
                "Social Service",
                "Event Management",
                "Digital Work",
                "Community Support",
                "Other"
            )
            val savedArea = item.stringValue("area") ?: item.stringValue("interest") ?: item.stringValue("areaOfInterest") ?: ""
            root.addView(TextView(this).apply {
                text = "Area of interest"; textSize = 13f
                setTextColor(if (darkMode) Color.WHITE else ink)
                setPadding(dp(2), dp(2), 0, dp(5))
            })
            val area = android.widget.Spinner(this).apply {
                val areaAdapter = object : android.widget.ArrayAdapter<String>(this@MainActivity, android.R.layout.simple_spinner_item, areaOptions) {
                    override fun getView(position: Int, convertView: View?, parent: android.view.ViewGroup): View {
                        return (super.getView(position, convertView, parent) as TextView).apply {
                            textSize = 15f
                            setTextColor(if (darkMode) Color.WHITE else ink)
                            setPadding(dp(14), dp(8), dp(12), dp(8))
                        }
                    }
                    override fun getDropDownView(position: Int, convertView: View?, parent: android.view.ViewGroup): View {
                        return (super.getDropDownView(position, convertView, parent) as TextView).apply {
                            textSize = 15f
                            setTextColor(ink)
                            setBackgroundColor(Color.WHITE)
                            setPadding(dp(16), dp(12), dp(16), dp(12))
                        }
                    }
                }
                areaAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                adapter = areaAdapter
                background = android.graphics.drawable.GradientDrawable().apply {
                    cornerRadius = dp(12).toFloat()
                    setColor(if (darkMode) Color.rgb(30, 41, 59) else Color.WHITE)
                    setStroke(dp(1), if (darkMode) Color.rgb(71, 85, 105) else Color.rgb(220, 226, 235))
                }
                layoutParams = LinearLayout.LayoutParams(-1, dp(54)).apply { bottomMargin = dp(10) }
                val selected = areaOptions.indexOfFirst { it.equals(savedArea, true) }
                setSelection(if (selected >= 0) selected else 0)
            }
            root.addView(area)
            currentProfilePhotoUrl = item.stringValue("photoUrl") ?: ""
            prefs.edit().putString("displayName", item.stringValue("name") ?: "Volunteer").putString("photoUrl", currentProfilePhotoUrl).apply()
            val photoPreview = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; layoutParams = LinearLayout.LayoutParams(dp(112), dp(112)).apply { bottomMargin = dp(8) }; contentDescription = "Profile photo" }
            root.addView(photoPreview)
            if (currentProfilePhotoUrl.isNotBlank()) com.bumptech.glide.Glide.with(this).load(currentProfilePhotoUrl).placeholder(android.R.drawable.ic_menu_camera).error(android.R.drawable.ic_menu_camera).into(photoPreview) else photoPreview.setImageResource(android.R.drawable.ic_menu_camera)
            actionButton("Upload Profile Photo") { photoPicker.launch("image/*") }
            paragraph("Status: ${item.stringValue("status") ?: "approved"} • Application: ${item.stringValue("applicationNo") ?: "-"}")
            actionButton("Save Profile") {
                val selectedArea = area.selectedItem?.toString().orEmpty()
                if (selectedArea.isBlank() || selectedArea == "Choose area of interest") { message("Please select an area of interest."); return@actionButton }
                val payload = JsonObject().apply { addProperty("name", name.text.toString().trim()); addProperty("email", email.text.toString().trim()); addProperty("city", city.text.toString().trim()); addProperty("area", selectedArea) }
                lifecycleScope.launch { try { val r = ApiClient.service.updateMyVolunteerProfile("Bearer $token", payload); if (r.isSuccessful) { message("Profile updated."); loadMyVolunteerProfile() } else message(r.errorBody()?.string() ?: "Profile update failed.") } catch (e: Exception) {  message(networkErrorMessage(e, "Profile update failed")) } }
            }
            actionButton("Back to Dashboard", { showRoleHome("volunteer") }, navy2)
        }
    }

    private fun uploadVolunteerPhoto(uri: Uri) {
        lifecycleScope.launch {
            try {
                val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("Unable to read selected image")
                if (bytes.size > 5 * 1024 * 1024) { message("Choose an image smaller than 5 MB."); return@launch }
                val mime = contentResolver.getType(uri) ?: "image/jpeg"
                val requestBody = bytes.toRequestBody(mime.toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("image", "profile-image", requestBody)
                val response = ApiClient.service.uploadMyVolunteerPhoto("Bearer $token", part)
                if (response.isSuccessful) { message("Profile photo updated."); val uploaded = response.body()?.get("photoUrl")?.asString ?: ""; prefs.edit().putString("photoUrl", uploaded).apply(); loadMyVolunteerProfile() }
                else message(response.errorBody()?.string() ?: "Photo upload failed. Check backend configuration.")
            } catch (e: Exception) { message("Photo upload failed: ${networkErrorMessage(e, "Please retry.")}")}
        }
    }

    private fun loadMyDonations() {
        request("Loading your donation history…", { ApiClient.service.myDonations("Bearer $token") }) { body ->
            setup("My Donation History", true); heading("My Donations", 22f)
            paragraph("Total paid: ₹${body.get("totalPaid")?.asDouble ?: 0.0} • Successful donations: ${body.get("count")?.asInt ?: 0}")
            val rows = body.arrayValue("items")
            if (rows.size() == 0) paragraph("No donation records found yet.")
            rows.forEach { element ->
                val obj = element.asJsonObjectOrNull() ?: return@forEach
                val amount = obj.get("amount")?.asString ?: obj.get("amount")?.toString() ?: "0"
                val purposeText = obj.stringValue("purpose") ?: "General Seva"
                val receiptNo = obj.stringValue("receiptNo") ?: "-"
                val statusText = obj.stringValue("status") ?: "pending"
                val c = card()
                c.addView(TextView(this).apply { text = "₹$amount • $purposeText"; textSize = 16f; setTextColor(if (darkMode) Color.WHITE else navy); setTypeface(typeface, Typeface.BOLD) })
                c.addView(TextView(this).apply { text = "$receiptNo • $statusText"; textSize = 12f; setTextColor(if (darkMode) Color.LTGRAY else muted) })
                actionButton("Download Receipt", {
                    pendingReceiptText = "SWAMI VIVEKANAND VICHAR PRACHAR SEVA SAMITI\nDonation Receipt\nReceipt No: $receiptNo\nAmount: INR $amount\nPurpose: $purposeText\nStatus: $statusText\nDonor: ${obj.stringValue("donorName") ?: prefs.getString("displayName", "") ?: ""}\nDate: ${obj.stringValue("paidAt") ?: obj.stringValue("createdAt") ?: ""}\n\nThank you for supporting the Samiti."
                    receiptSaver.launch("Receipt_$receiptNo.txt")
                }, saffron)
            }
            actionButton("Back to Dashboard", { showRoleHome("volunteer") }, navy2)
        }
    }

    private fun showDonateScreen() {
        setup("Support the Cause", token.isNotBlank())
        heading("Your contribution makes a difference", 22f)
        paragraph("Secure donation for Swami Vivekanand Vichar Prachar Seva Samiti. Your payment is verified by the existing server before it is marked successful.")
        val signedInRole = prefs.getString("role", "") ?: ""
        val signedIn = token.isNotBlank() && (signedInRole.equals("volunteer", true) || signedInRole.equals("admin", true))
        val donorName = input("Full name").apply { if (signedIn) { setText(prefs.getString("displayName", "") ?: ""); isEnabled = false } }
        val email = input("Email for donation receipt")
        val mobile = input("Mobile number", mobile = true).apply { if (signedIn) { setText(prefs.getString("phone", "") ?: ""); isEnabled = false } }
        val purpose = android.widget.Spinner(this).apply {
            adapter = android.widget.ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item,
                listOf("General Seva", "Education", "Social Service", "Yuva Jagran", "Event Management"))
            layoutParams = LinearLayout.LayoutParams(-1, dp(52)).apply { bottomMargin = dp(10) }
        }
        root.addView(purpose)
        heading("Choose donation amount", 17f)
        var selectedAmount = 501.0
        val amounts = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        listOf(101.0, 501.0, 1001.0).forEach { amount ->
            val b = MaterialButton(this).apply {
                text = "₹${amount.toInt()}"; isAllCaps = false; cornerRadius = dp(10)
                backgroundTintList = android.content.res.ColorStateList.valueOf(if (amount == selectedAmount) saffron else navy2)
                setTextColor(Color.WHITE)
                layoutParams = LinearLayout.LayoutParams(0, dp(46), 1f).apply { marginEnd = dp(5) }
                setOnClickListener {
                    selectedAmount = amount
                    for (i in 0 until amounts.childCount) {
                        (amounts.getChildAt(i) as? MaterialButton)?.backgroundTintList = android.content.res.ColorStateList.valueOf(if ((amounts.getChildAt(i) as? MaterialButton)?.text?.toString() == "₹${amount.toInt()}") saffron else navy2)
                    }
                }
            }
            amounts.addView(b)
        }
        root.addView(amounts)
        val customAmount = input("Or enter custom amount (₹)")
        customAmount.inputType = 8194
        paragraph("Minimum and maximum limits are validated by the existing backend. Payment opens in Razorpay Checkout.", 12f)
        actionButton("Continue to Secure Payment", {
            val name = donorName.text.toString().trim()
            val mail = email.text.toString().trim()
            val phoneValue = mobile.text.toString().trim()
            val amountText = customAmount.text.toString().trim()
            val amount = if (amountText.isNotBlank()) amountText.toDoubleOrNull() else selectedAmount
            if (name.length < 2) { message("Please enter your full name."); return@actionButton }
            if (phoneValue.filter { it.isDigit() }.length != 10) { message("Please enter a valid 10-digit mobile number."); return@actionButton }
            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(mail).matches()) { message("Please enter a valid email for the receipt."); return@actionButton }
            if (phoneValue.length < 10) { message("Please enter a valid mobile number."); return@actionButton }
            if (amount == null || amount <= 0.0) { message("Please enter a valid donation amount."); return@actionButton }
            if (loading) return@actionButton
            loading = true
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.createDonationOrder(DonationOrderRequest(name, mail, phoneValue, amount, purpose.selectedItem.toString()))
                    val body = response.body()
                    if (!response.isSuccessful || body?.booleanValue("success") != true) {
                        message(body?.stringValue("message") ?: "Could not create donation order. Check server settings.")
                        return@launch
                    }
                    val order = body.getAsJsonObject("order")
                    val keyId = body.stringValue("keyId")
                    if (order == null || keyId.isNullOrBlank()) { message("Payment gateway is not configured on the server."); return@launch }
                    pendingDonationId = body.stringValue("donationId") ?: ""
                    pendingOrderId = order.stringValue("id") ?: ""
                    pendingReceiptNo = body.stringValue("receiptNo") ?: ""
                    if (pendingDonationId.isBlank() || pendingOrderId.isBlank()) { message("Invalid payment order returned by server."); return@launch }
                    val checkout = Checkout()
                    checkout.setKeyID(keyId)
                    val options = JSONObject().apply {
                        put("name", "Swami Vivekanand Samiti")
                        put("description", purpose.selectedItem.toString())
                        put("order_id", pendingOrderId)
                        put("currency", order.stringValue("currency") ?: "INR")
                        put("amount", order.get("amount").asLong)
                        put("prefill", JSONObject().apply { put("name", name); put("email", mail); put("contact", phoneValue) })
                        put("theme", JSONObject().apply { put("color", "#E88525") })
                        put("notes", JSONObject().apply { put("receiptNo", pendingReceiptNo); put("purpose", purpose.selectedItem.toString()) })
                    }
                    checkout.open(this@MainActivity, options)
                } catch (e: Exception) {
                    message("Payment could not be started: ${e.localizedMessage ?: "Please try again."}")
                } finally { loading = false }
            }
        }, green)
        actionButton("Back to Home", { showRoleHome(prefs.getString("role", "user") ?: "user") }, navy2)
    }

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        val data = paymentData
        if (data == null || pendingDonationId.isBlank()) {
            message("Payment was received but verification data is missing. Contact the Samiti with your payment ID.")
            return
        }
        lifecycleScope.launch {
            try {
                val payload = JsonObject().apply {
                    addProperty("donationId", pendingDonationId)
                    addProperty("razorpay_order_id", data.orderId)
                    addProperty("razorpay_payment_id", data.paymentId ?: razorpayPaymentId ?: "")
                    addProperty("razorpay_signature", data.signature ?: "")
                }
                val response = ApiClient.service.verifyDonationPayment(payload)
                val body = response.body()
                if (response.isSuccessful && body?.booleanValue("success") == true) {
                    val donation = body.getAsJsonObject("donation")
                    setup("Donation Successful", token.isNotBlank())
                    heading("Thank you for your contribution!", 22f)
                    paragraph("Your payment has been verified by the server.", 14f, green)
                    val c = card()
                    c.addView(TextView(this@MainActivity).apply { text = "Receipt: ${donation?.stringValue("receiptNo") ?: pendingReceiptNo}"; textSize = 16f; setTextColor(navy); setTypeface(typeface, Typeface.BOLD) })
                    c.addView(TextView(this@MainActivity).apply { text = "Amount: ₹${donation?.stringValue("amount") ?: "—"}\nPurpose: ${donation?.stringValue("purpose") ?: "General Seva"}\nPayment ID: ${donation?.stringValue("razorpayPaymentId") ?: razorpayPaymentId ?: "—"}"; textSize = 13f; setTextColor(muted); setPadding(0, dp(8), 0, 0) })
                    actionButton("Done", { showRoleHome(prefs.getString("role", "user") ?: "user") }, green)
                } else {
                    message(body?.stringValue("message") ?: "Payment verification is pending. Please contact support before retrying.")
                }
            } catch (e: Exception) {
                message("Payment was submitted but verification could not be reached. Do not pay again yet; contact support with payment ID ${razorpayPaymentId ?: ""}.")
            } finally {
                pendingDonationId = ""; pendingOrderId = ""; pendingReceiptNo = ""
            }
        }
    }

    override fun onPaymentError(code: Int, description: String?, paymentData: PaymentData?) {
        message("Payment not completed: ${description ?: "Please try again."}")
        pendingDonationId = ""; pendingOrderId = ""; pendingReceiptNo = ""
    }

    private fun loadDonationSettings() {
        request("Loading donation settings…", { ApiClient.service.donationSettings("Bearer $token") }) {
            showJsonScreen("Donation Settings", it, true)
        }
    }

    private fun loadDonations() {
        request("Loading donations…", { ApiClient.service.donations("Bearer $token") }) {
            val rows = it.arrayValue("items", "data", "donations")
            setup("Donations & Finance", true)
            heading("Donations & Finance")
            val paidRows = rows.filter { it.asJsonObjectOrNull()?.stringValue("status")?.equals("paid", true) == true }
            val paidTotal = paidRows.sumOf { it.asJsonObjectOrNull()?.get("amount")?.let { v -> try { v.asDouble } catch (_: Exception) { v.toString().toDoubleOrNull() ?: 0.0 } } ?: 0.0 }
            val pendingRows = rows.count { it.asJsonObjectOrNull()?.stringValue("status")?.equals("pending", true) == true }
            paragraph("Total donations: ${rows.size()}   •   Paid: ${paidRows.size}   •   Pending: $pendingRows\nPaid amount: ₹${"%.2f".format(paidTotal)}")
            if (rows.size() == 0) paragraph("No donation records returned. Check admin permissions or backend response.")
            rows.forEachIndexed { index, element ->
                val obj = element.asJsonObjectOrNull() ?: return@forEachIndexed
                val title = obj.stringValue("donorName") ?: obj.stringValue("title") ?: obj.stringValue("name") ?: "Donation ${index + 1}"
                val amount = obj.stringValue("amount") ?: obj.stringValue("total") ?: "—"
                val purpose = obj.stringValue("purpose") ?: "General Seva"
                val status = obj.stringValue("status") ?: "unknown"
                val phoneValue = obj.stringValue("phone") ?: ""
                val receiptNo = obj.stringValue("receiptNo") ?: "—"
                val date = obj.stringValue("paidAt") ?: obj.stringValue("createdAt") ?: obj.stringValue("date") ?: ""
                val c = card()
                c.addView(TextView(this).apply { text = title; textSize = 16f; setTextColor(if (darkMode) Color.WHITE else navy); setTypeface(typeface, Typeface.BOLD) })
                c.addView(TextView(this).apply { text = "₹$amount • $purpose • ${status.uppercase()}\nMobile: $phoneValue\nReceipt: $receiptNo${if (date.isNotBlank()) "\n$date" else ""}"; textSize = 13f; setTextColor(if (darkMode) Color.LTGRAY else muted); setPadding(0, dp(5), 0, 0) })
                actionButton("Download Receipt", { pendingReceiptText = "SWAMI VIVEKANAND VICHAR PRACHAR SEVA SAMITI\nDonation Receipt\nReceipt No: $receiptNo\nDonor: $title\nMobile: $phoneValue\nAmount: INR $amount\nPurpose: $purpose\nStatus: $status\nDate: $date"; receiptSaver.launch("Receipt_$receiptNo.txt") }, saffron)
            }
            actionButton("Back to Dashboard", { showRoleHome("admin") }, navy2)
        }
    }

    private fun loadAdminProfile() {
        request("Loading admin profile…", { ApiClient.service.currentAdmin("Bearer $token") }) { body ->
            val item = body.getAsJsonObject("profile") ?: body.getAsJsonObject("admin") ?: body
            setup("Admin Profile", true); heading("Admin Profile")
            val display = input("Display name").apply { setText(item.stringValue("displayName") ?: item.stringValue("username") ?: "") }
            val email = input("Email").apply { setText(item.stringValue("email") ?: "") }
            val phoneField = input("Mobile number", mobile = true).apply { setText(item.stringValue("phone") ?: "") }
            val designation = input("Designation").apply { setText(item.stringValue("designation") ?: "Administrator") }
            val department = input("Department").apply { setText(item.stringValue("department") ?: "Administration") }
            val bio = input("Bio").apply { setText(item.stringValue("bio") ?: "") }
            currentAdminPhotoUrl = item.stringValue("profileImage") ?: ""
            prefs.edit().putString("adminEmail", item.stringValue("email") ?: "").putString("adminDesignation", item.stringValue("designation") ?: "Administrator").putString("adminDepartment", item.stringValue("department") ?: "Administration").putString("adminBio", item.stringValue("bio") ?: "").putString("photoUrl", currentAdminPhotoUrl).apply()
            val preview = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; layoutParams = LinearLayout.LayoutParams(dp(110), dp(110)).apply { bottomMargin = dp(8) } }
            root.addView(preview)
            if (currentAdminPhotoUrl.isNotBlank()) com.bumptech.glide.Glide.with(this).load(currentAdminPhotoUrl).placeholder(R.drawable.samiti_logo).into(preview) else preview.setImageResource(R.drawable.samiti_logo)
            actionButton("Upload Profile Photo") { adminPhotoPicker.launch("image/*") }
            actionButton("Save Admin Profile") {
                lifecycleScope.launch {
                    try {
                        val txt = "text/plain".toMediaTypeOrNull()
                        fun part(v: String) = v.toRequestBody(txt)
                        val r = ApiClient.service.updateAdminProfile("Bearer $token", part(display.text.toString().trim()), part(email.text.toString().trim()), part(phoneField.text.toString().trim()), part(designation.text.toString().trim()), part(department.text.toString().trim()), part(bio.text.toString().trim()), null)
                        if (r.isSuccessful) { prefs.edit().putString("displayName", display.text.toString().trim()).putString("phone", phoneField.text.toString().trim()).apply(); message("Admin profile updated."); loadAdminProfile() } else message(r.errorBody()?.string() ?: "Profile update failed.")
                    } catch (e: Exception) { message(networkErrorMessage(e, "Profile update failed.")) }
                }
            }
            actionButton("Back to Dashboard", { showRoleHome("admin") }, navy2)
        }
    }

    private fun uploadAdminPhoto(uri: Uri) {
        lifecycleScope.launch {
            try {
                val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw IllegalStateException("Unable to read selected image")
                if (bytes.size > 5 * 1024 * 1024) { message("Choose an image smaller than 5 MB."); return@launch }
                val mime = contentResolver.getType(uri) ?: "image/jpeg"
                val part = MultipartBody.Part.createFormData("profileImage", "admin-profile.jpg", bytes.toRequestBody(mime.toMediaTypeOrNull()))
                val txt = "text/plain".toMediaTypeOrNull()
                fun field(v: String) = v.toRequestBody(txt)
                val r = ApiClient.service.updateAdminProfile("Bearer $token", field(prefs.getString("displayName", "Administrator") ?: "Administrator"), field(prefs.getString("adminEmail", "") ?: ""), field(prefs.getString("phone", "") ?: ""), field(prefs.getString("adminDesignation", "Administrator") ?: "Administrator"), field(prefs.getString("adminDepartment", "Administration") ?: "Administration"), field(prefs.getString("adminBio", "") ?: ""), part)
                if (r.isSuccessful) { val profile = r.body()?.getAsJsonObject("profile"); currentAdminPhotoUrl = profile?.stringValue("profileImage") ?: ""; prefs.edit().putString("photoUrl", currentAdminPhotoUrl).apply(); message("Admin photo uploaded."); loadAdminProfile() } else message(r.errorBody()?.string() ?: "Admin photo upload failed.")
            } catch (e: Exception) { message("Admin photo upload failed: ${networkErrorMessage(e)}") }
        }
    }

    private fun showJsonScreen(title: String, body: JsonObject, showLogout: Boolean) {
        setup(title, showLogout)
        heading(title)
        val content = body.get("settings") ?: body.get("data") ?: body.get("admin") ?: body.get("profile") ?: body
        val obj = content.asJsonObjectOrNull()
        if (obj == null || obj.entrySet().isEmpty()) {
            paragraph(body.stringValue("message") ?: "The server returned no displayable fields.")
        } else {
            obj.entrySet().forEach { entry ->
                val c = card()
                c.addView(TextView(this).apply { text = prettyLabel(entry.key); textSize = 12f; setTextColor(muted) })
                c.addView(TextView(this).apply { text = safeValue(entry.value); textSize = 15f; setTextColor(ink); setPadding(0, dp(4), 0, 0) })
            }
        }
        actionButton("Back to Dashboard", { showRoleHome(prefs.getString("role", "user") ?: "user") }, navy2)
    }

    private fun request(
        progress: String,
        call: suspend () -> retrofit2.Response<JsonObject>,
        onSuccess: (JsonObject) -> Unit
    ) {
        if (loading) return
        loading = true
        message(progress)
        lifecycleScope.launch {
            try {
                val response = call()
                val body = response.body()
                if (response.isSuccessful && body != null && body.booleanValue("success", default = true)) {
                    onSuccess(body)
                } else {
                    val errorBody = try { response.errorBody()?.string() } catch (_: Exception) { null }
                    message(body?.stringValue("message") ?: errorBody ?: "Request failed (${response.code()}).")
                }
            } catch (e: Exception) {
                message(networkErrorMessage(e, "Request failed. Please try again."))
            } finally { loading = false }
        }
    }

    private fun getAppVersion(): String {
        return try {
            val info = packageManager.getPackageInfo(packageName, 0)
            "Version ${info.versionName ?: "1.0.0"}"
        } catch (e: Exception) {
            "Version 1.0.0"
        }
    }

    private fun logout() {
        lifecycleScope.launch {
            try { if (token.isNotBlank()) ApiClient.service.adminLogout("Bearer $token") } catch (_: Exception) { }
            prefs.edit().clear().apply()
            token = ""
            showWelcome()
        }
    }

    private fun prettyLabel(key: String): String = key.replace(Regex("([a-z])([A-Z])"), "$1 $2").replaceFirstChar { it.uppercase() }
    private fun safeValue(value: JsonElement): String = when {
        value.isJsonNull -> "—"
        value.isJsonObject || value.isJsonArray -> value.toString()
        else -> value.asString
    }
    private fun JsonObject.stringValue(key: String): String? {
        val v = get(key) ?: return null
        return if (v.isJsonNull || v.isJsonObject || v.isJsonArray) null else try { v.asString } catch (_: Exception) { v.toString() }
    }
    private fun JsonObject.booleanValue(key: String, default: Boolean = false): Boolean {
        val v = get(key) ?: return default
        return try { v.asBoolean } catch (_: Exception) { default }
    }
    private fun JsonObject.arrayValue(vararg keys: String): JsonArray {
        keys.forEach { key ->
            val value = get(key)
            if (value != null && value.isJsonArray) return value.asJsonArray
            if (value != null && value.isJsonObject) {
                val nested = value.asJsonObject
                keys.forEach { nestedKey ->
                    val child = nested.get(nestedKey)
                    if (child != null && child.isJsonArray) return child.asJsonArray
                }
            }
        }
        return JsonArray()
    }
    private fun JsonElement.asJsonObjectOrNull(): JsonObject? = try { if (isJsonObject) asJsonObject else null } catch (_: Exception) { null }
}