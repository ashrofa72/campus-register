/*
 * ERROR: This file name 'firebase/storage.ts' collides with the official 'firebase/storage' module.
 * This causes circular dependency errors and prevents 'firebase/config.ts' from importing the real storage SDK.
 * 
 * Since the functionality in this file (uploadProfileImage) is currently unused by the application
 * (ProfilePage uses Firestore base64 storage instead), the code has been commented out to fix the build.
 * 
 * TO RESTORE THIS FUNCTIONALITY:
 * 1. Rename this file to 'firebase/storageService.ts' (or any name other than 'storage.ts').
 * 2. Uncomment the code below.
 * 3. Ensure 'firebase/config.ts' exports 'storage' again.
 */

/*
import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const uploadProfileImage = async (file: File, uid: string): Promise<string> => {
    // Create a unique filename using timestamp and sanitize it
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filename = `${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, `avatars/${uid}/${filename}`);
    
    const metadata = {
        contentType: file.type
    };

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Optional: logic to track progress can be added here
            }, 
            (error) => {
                // Handle unsuccessful uploads
                console.error("Storage upload error details:", error);
                reject(error);
            }, 
            async () => {
                // Handle successful uploads on complete
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (e) {
                    console.error("Failed to get download URL", e);
                    reject(e);
                }
            }
        );
    });
};
*/