const firebaseConfig = {
  apiKey: "AIzaSyD8vf03TFtULQHlWaFl_r8GiRGM0BF4q-s",
  authDomain: "blockdays-iwnl.firebaseapp.com",
  projectId: "blockdays-iwnl",
  storageBucket: "blockdays-iwnl.firebasestorage.app",
  messagingSenderId: "820219952354",
  appId: "1:820219952354:web:4e745073c8a0157ae232bb",
  measurementId: "G-D8Z2TWSNTC"
};

if (typeof window !== "undefined") {
  window.blockdaysFirebaseConfig = firebaseConfig;
}

if (typeof module !== "undefined") {
  module.exports = firebaseConfig;
}