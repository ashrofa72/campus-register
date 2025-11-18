
import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase-storage-sdk';

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
