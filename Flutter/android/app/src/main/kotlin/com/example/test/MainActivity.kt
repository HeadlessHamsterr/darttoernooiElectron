package com.darttoernooi.release
import android.view.View
import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
    override fun onStart() {
        super.onStart()
        window.decorView.visibility = View.VISIBLE
    }

    override fun onStop() {
        window.decorView.visibility = View.GONE
        super.onStop()
    }
}
