package org.swamisamiti.mobile;

/**
 * Small Java interoperability helper for projects that need Java-based Android classes.
 * The app UI and coroutine-based networking are implemented in Kotlin.
 */
public final class LegacyApiHelper {
    private LegacyApiHelper() {}
    public static boolean isValidIndianMobile(String phone) {
        if (phone == null) return false;
        String digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("91") && digits.length() == 12) digits = digits.substring(2);
        return digits.matches("[6-9][0-9]{9}");
    }
}
