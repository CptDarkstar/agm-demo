import { writable } from "svelte/store";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase/firebase"; // Assuming db is the Firestore database reference

// Initial state
const initialState = {
  showModal: false,
  selectedUser: {
    id: "", // User ID
    name: "", // Default name value
    email: "", // Default email value
    shares: 0, // Default shares value
  },
};

// Create writable store
const editUserStore = writable(initialState);

// Methods to update the store
const showEditModal = (user) => {
  return editUserStore.update((store) => {
    store.showModal = true;
    store.selectedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      shares: user.shares,
    };
    return store;
  });
};

const hideEditModal = () => {
  editUserStore.update((store) => {
    store.showModal = false;
    store.selectedUser = null;
    return store;
  });
};

// Function to update user data in Firestore
const updateUserInFirestore = async (updatedUserData) => {
  try {
    const { id, ...userData } = updatedUserData;
    const userDocRef = doc(db, "user", id);
    await updateDoc(userDocRef, userData);
    console.log("User data updated in Firestore");
  } catch (error) {
    console.error("Error updating user data in Firestore:", error);
  }
};

export { editUserStore, showEditModal, hideEditModal, updateUserInFirestore };
