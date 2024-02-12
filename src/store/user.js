import { doc, getDoc } from "firebase/firestore";

const docRef = doc(db, "user", 'pMpZbvAyUAcpTkVciQz8AEscCmw1');
export const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  console.log("Document data:", docSnap.data());
} else {
  // docSnap.data() will be undefined in this case
  console.log("No such document!");
}