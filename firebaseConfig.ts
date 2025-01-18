// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'

import { getDatabase } from 'firebase/database'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyBkUxSVDzEwr4nWZeRMwdUPanZVL91cDlc',
	authDomain: 'plan-zajec-3c0d7.firebaseapp.com',
	databaseURL: 'https://plan-zajec-3c0d7-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: 'plan-zajec-3c0d7',
	storageBucket: 'plan-zajec-3c0d7.firebasestorage.app',
	messagingSenderId: '557939298664',
	appId: '1:557939298664:web:29081a41c925c8d0c206dd',
	measurementId: 'G-04WV92XHWL',
}

// Initialize Firebase
// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig)

// Eksport bazy danych
export const database = getDatabase(app)
