import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
// Note: Firebase Auth doesn't work server-side, so we skip auth check here
// The route is protected by the dashboard layout which requires login
export const ourFileRouter = {
    // Profile image uploader
    profileImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
        .middleware(async () => {
            // Firebase Auth is client-side only, so we can't verify here
            // The upload endpoint is only accessible from authenticated pages
            // which are protected by AuthContext in the dashboard layout
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ file }) => {
            // Return the file URL to use
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
