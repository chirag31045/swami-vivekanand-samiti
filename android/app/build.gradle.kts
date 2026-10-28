
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services") version "4.4.2" apply false
}

// Firebase push is enabled when google-services.json is present in app/.
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "org.swamisamiti.mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "org.swamisamiti.mobile"
        minSdk = 24
        targetSdk = 35

        versionCode = 1
        versionName = "1.0"
//
//        buildConfigField(
//            "String",
//            "API_BASE_URL",
//            "\"https://swami-vivekanand-samiti-backend.vercel.app/api/\""
//        )
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"http://10.112.22.78:5000/api/\""
        )
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.drawerlayout:drawerlayout:1.2.0")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    implementation("com.razorpay:checkout:1.6.40")
    implementation(platform("com.google.firebase:firebase-bom:34.4.0"))
    implementation("com.google.firebase:firebase-messaging")
}
