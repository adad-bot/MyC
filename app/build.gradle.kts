plugins {
    id("com.android.application")
}

android {
    namespace = "ir.aqsat.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "ir.aqsat.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "1.2"
    }

    // کلید ثابت امضا: همهٔ بیلدها با همین کلید امضا می‌شوند تا
    // نسخهٔ جدید روی نسخهٔ قبلی نصب شود و داده‌ها از بین نرود.
    signingConfigs {
        create("myc") {
            storeFile = file("myc.jks")
            storePassword = "MyC2026KAM"
            keyAlias = "myc"
            keyPassword = "MyC2026KAM"
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("myc")
        }
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("myc")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(files("libs/core-3.5.3.jar"))
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
    implementation("androidx.core:core:1.13.1")
}
