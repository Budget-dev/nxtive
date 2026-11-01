// Re-export shared Firebase client for backward compatibility with @/lib/firebase imports
import { app, auth, db, storage, firebaseConfig } from "./firebase/client";

export { app, auth, db, storage, firebaseConfig };
export default app;
