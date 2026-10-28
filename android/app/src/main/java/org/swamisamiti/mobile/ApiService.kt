package org.swamisamiti.mobile

import android.os.Build

import com.google.gson.JsonObject
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.PUT
import retrofit2.http.Multipart
import retrofit2.http.Part

data class PhoneRequest(val phone: String, val name: String? = null)
data class VolunteerLoginRequest(val phone: String, val password: String, val platform: String = "android", val deviceName: String = "${Build.MANUFACTURER} ${Build.MODEL}", val userAgent: String = "Android ${Build.VERSION.RELEASE}")
data class VolunteerRegisterRequest(val name: String, val phone: String, val password: String, val email: String = "", val city: String = "", val area: String = "", val message: String = "")
data class OtpSendRequest(val phone: String, val purpose: String = "login")
data class OtpVerifyRequest(val phone: String, val otp: String, val platform: String = "android", val deviceName: String = "${Build.MANUFACTURER} ${Build.MODEL}", val userAgent: String = "Android ${Build.VERSION.RELEASE}")
data class PasswordResetRequest(val phone: String, val otp: String, val newPassword: String)
data class PasswordChangeRequest(val currentPassword: String, val newPassword: String)
data class AdminLoginRequest(val username: String, val password: String, val platform: String = "android", val deviceName: String = "${Build.MANUFACTURER} ${Build.MODEL}", val userAgent: String = "Android ${Build.VERSION.RELEASE}")
data class DonationOrderRequest(val donorName: String, val email: String, val phone: String, val amount: Double, val purpose: String)
data class ApiResult(
    val success: Boolean = false,
    val message: String? = null,
    val token: String? = null,
    val role: String? = null,
    val user: Map<String, Any>? = null,
    val admin: Map<String, Any>? = null
)

interface ApiService {
    @POST("mobile-auth/login") suspend fun volunteerLogin(@Body body: VolunteerLoginRequest): Response<ApiResult>
    @POST("mobile-auth/register") suspend fun registerVolunteerAccount(@Body body: VolunteerRegisterRequest): Response<ApiResult>
    @POST("mobile-auth/otp/send") suspend fun sendMobileOtp(@Body body: OtpSendRequest): Response<ApiResult>
    @POST("mobile-auth/otp/verify") suspend fun verifyMobileOtp(@Body body: OtpVerifyRequest): Response<ApiResult>
    @POST("mobile-auth/password/forgot/reset") suspend fun resetPasswordWithOtp(@Body body: PasswordResetRequest): Response<ApiResult>
    @POST("mobile-auth/password/change/volunteer") suspend fun changeVolunteerPassword(@Header("Authorization") bearer: String, @Body body: PasswordChangeRequest): Response<ApiResult>
    @POST("mobile-auth/password/change/admin") suspend fun changeAdminPassword(@Header("Authorization") bearer: String, @Body body: PasswordChangeRequest): Response<ApiResult>
    @GET("volunteer/me") suspend fun myVolunteerProfile(@Header("Authorization") bearer: String): Response<JsonObject>
    @PATCH("volunteer/me") suspend fun updateMyVolunteerProfile(@Header("Authorization") bearer: String, @Body body: JsonObject): Response<JsonObject>
    @Multipart @POST("volunteer/me/photo") suspend fun uploadMyVolunteerPhoto(@Header("Authorization") bearer: String, @Part image: MultipartBody.Part): Response<JsonObject>
    @GET("donations/my") suspend fun myDonations(@Header("Authorization") bearer: String): Response<JsonObject>

    @POST("admin/login") suspend fun adminLogin(@Body body: AdminLoginRequest): Response<JsonObject>
    @POST("admin/logout") suspend fun adminLogout(@Header("Authorization") bearer: String): Response<JsonObject>
    @POST("device-sessions/logout") suspend fun logoutDeviceSession(@Header("Authorization") bearer: String): Response<JsonObject>
    @GET("admin/notifications") suspend fun adminNotifications(@Header("Authorization") bearer: String, @Query("page") page: Int = 1, @Query("limit") limit: Int = 25): Response<JsonObject>
    @PATCH("admin/notifications/{id}/read") suspend fun markAdminNotificationRead(@Header("Authorization") bearer: String, @Path("id") id: String): Response<JsonObject>
    @GET("admin/profile") suspend fun currentAdmin(@Header("Authorization") bearer: String): Response<JsonObject>
    @Multipart @PUT("admin/profile") suspend fun updateAdminProfile(@Header("Authorization") bearer: String, @Part("displayName") displayName: okhttp3.RequestBody, @Part("email") email: okhttp3.RequestBody, @Part("phone") phone: okhttp3.RequestBody, @Part("designation") designation: okhttp3.RequestBody, @Part("department") department: okhttp3.RequestBody, @Part("bio") bio: okhttp3.RequestBody, @Part profileImage: MultipartBody.Part?): Response<JsonObject>

    @POST("volunteers") suspend fun createVolunteer(@Body body: JsonObject): Response<JsonObject>
    @GET("volunteers") suspend fun volunteers(
        @Header("Authorization") bearer: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<JsonObject>
    @PATCH("volunteers/{id}/status") suspend fun updateVolunteerStatus(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
        @Body body: JsonObject
    ): Response<JsonObject>
    @DELETE("volunteers/{id}") suspend fun deleteVolunteer(
        @Header("Authorization") bearer: String,
        @Path("id") id: String
    ): Response<JsonObject>

    @GET("donation-settings/public") suspend fun publicDonationSettings(): Response<JsonObject>
    @POST("donations/create-order") suspend fun createDonationOrder(@Body body: DonationOrderRequest): Response<JsonObject>
    @POST("donations/verify") suspend fun verifyDonationPayment(@Body body: JsonObject): Response<JsonObject>
    @GET("donations/receipt/{receiptNo}") suspend fun donationReceipt(@Path("receiptNo") receiptNo: String): Response<JsonObject>

    @GET("gallery") suspend fun gallery(): Response<JsonObject>
    @Multipart @POST("gallery/upload") suspend fun uploadGallery(@Header("Authorization") bearer: String, @Part photo: MultipartBody.Part): Response<JsonObject>
    @Multipart @retrofit2.http.PUT("gallery/{id}") suspend fun updateGallery(@Header("Authorization") bearer: String, @Path("id") id: String, @Part photo: MultipartBody.Part?): Response<JsonObject>
    @DELETE("gallery/{id}") suspend fun deleteGallery(
        @Header("Authorization") bearer: String,
        @Path("id") id: String
    ): Response<JsonObject>
    @GET("activities") suspend fun activities(): Response<JsonObject>
    @Multipart @POST("activities") suspend fun createActivity(@Header("Authorization") bearer: String, @Part("activityNo") activityNo: okhttp3.RequestBody, @Part("hiTitle") hiTitle: okhttp3.RequestBody, @Part("hiShortText") hiShortText: okhttp3.RequestBody, @Part("hiDetails") hiDetails: okhttp3.RequestBody, @Part("enTitle") enTitle: okhttp3.RequestBody, @Part("enShortText") enShortText: okhttp3.RequestBody, @Part("enDetails") enDetails: okhttp3.RequestBody, @Part image: MultipartBody.Part): Response<JsonObject>
    @Multipart @retrofit2.http.PUT("activities/{activityNo}") suspend fun updateActivity(@Header("Authorization") bearer: String, @Path("activityNo") activityNo: Int, @Part("hiTitle") hiTitle: okhttp3.RequestBody, @Part("hiShortText") hiShortText: okhttp3.RequestBody, @Part("hiDetails") hiDetails: okhttp3.RequestBody, @Part("enTitle") enTitle: okhttp3.RequestBody, @Part("enShortText") enShortText: okhttp3.RequestBody, @Part("enDetails") enDetails: okhttp3.RequestBody, @Part image: MultipartBody.Part?): Response<JsonObject>
    @DELETE("activities/{activityNo}") suspend fun deleteActivity(@Header("Authorization") bearer: String, @Path("activityNo") activityNo: Int): Response<JsonObject>
    @GET("site-settings/public") suspend fun publicSiteSettings(): Response<JsonObject>
    @GET("site-settings/admin") suspend fun adminSiteSettings(@Header("Authorization") bearer: String): Response<JsonObject>
    @Multipart @retrofit2.http.PUT("site-settings/admin") suspend fun updateAdminSiteSettings(@Header("Authorization") bearer: String, @Part("nameEn") nameEn: okhttp3.RequestBody, @Part("taglineEn") taglineEn: okhttp3.RequestBody, @Part("phone") phone: okhttp3.RequestBody, @Part("email") email: okhttp3.RequestBody, @Part("addressEn") addressEn: okhttp3.RequestBody, @Part("contactIntroEn") contactIntroEn: okhttp3.RequestBody, @Part logo: MultipartBody.Part?, @Part poster: MultipartBody.Part?): Response<JsonObject>
    @GET("donation-settings/admin") suspend fun donationSettings(@Header("Authorization") bearer: String): Response<JsonObject>
    @GET("donations/admin") suspend fun donations(@Header("Authorization") bearer: String): Response<JsonObject>
}
