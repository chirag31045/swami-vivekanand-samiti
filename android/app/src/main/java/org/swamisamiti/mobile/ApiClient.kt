package org.swamisamiti.mobile

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    val service: ApiService by lazy {
        val client = OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        Retrofit.Builder().baseUrl(BuildConfig.API_BASE_URL)
            .client(client).addConverterFactory(GsonConverterFactory.create()).build()
            .create(ApiService::class.java)
    }
}
