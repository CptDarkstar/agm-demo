// Proxy data model (unchanged from the original AddProxy flow — castVote in
// AdminVotingTopic.svelte reads it):
//
// - Entries live on the HOLDER (the person who votes): users/{H}.proxies[]
//   { proxyID, principalId: H, principalName, proxyUserId: G (the giver),
//     proxyUserName, proxyUserShares, topicId, voteInstruction }
//   topicId "None" + voteInstruction "None"  → free vote on every topic
//   topicId "<topic>" + "yes" | "no" | "abstain" → forced vote on that topic
// - The GIVER is disabled via the Node backend and gets users/{G}.proxyTo = holder's name.
import axios from "axios";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "$lib/firebase/firebase";

export const NODE_API = "https://agm-demo-node.onrender.com";

export const INSTRUCTIONS = [
  { key: "free", label: "Free", color: "rgba(255,255,255,.85)" },
  { key: "yes", label: "Yes", color: "#5fd08a" },
  { key: "no", label: "No", color: "#ff8a90" },
  { key: "abstain", label: "Abstain", color: "#cfd8da" },
];

function isSpecific(entry) {
  return (
    entry.topicId !== "None" &&
    !!entry.voteInstruction &&
    entry.voteInstruction !== "None"
  );
}

function isFreeBase(entry) {
  return entry.topicId === "None" && entry.voteInstruction === "None";
}

// Builds lookup tables from the users snapshot:
//   givenTo[giverId] = { holderId, holderName, entries }
//   heldBy[holderId] = [{ giverId, name, shares, instructed }]
export function indexProxies(users) {
  const givenTo = {};
  const heldBy = {};
  for (const holder of users) {
    const byGiver = {};
    for (const entry of holder.proxies || []) {
      if (!entry || !entry.proxyUserId) continue;
      if (!byGiver[entry.proxyUserId]) byGiver[entry.proxyUserId] = [];
      byGiver[entry.proxyUserId].push(entry);
    }
    for (const [giverId, entries] of Object.entries(byGiver)) {
      if (!givenTo[giverId]) {
        givenTo[giverId] = {
          holderId: holder.id,
          holderName: holder.displayName || "",
          entries,
        };
      }
      if (!heldBy[holder.id]) heldBy[holder.id] = [];
      heldBy[holder.id].push({
        giverId,
        name: entries[0].proxyUserName || "",
        // castVote counts the shares copied onto the entry, not the giver's live total
        shares: Math.max(...entries.map((e) => Number(e.proxyUserShares) || 0)),
        instructed: entries.some(isSpecific),
      });
    }
  }
  return { givenTo, heldBy };
}

// How a giver's shares are cast on one topic, mirroring castVote:
// "yes" | "no" | "abstain" (forced), "free" (holder decides), or null (not counted).
export function instructionFor(entries, topicId) {
  const specific = entries.find((e) => e.topicId === topicId && isSpecific(e));
  if (specific) return String(specific.voteInstruction).toLowerCase();
  if (entries.some(isFreeBase)) return "free";
  return null;
}

// Rewrites a holder's proxies without the given giver's entries (plus optional
// new entries). Reads the doc fresh first so we don't overwrite other changes
// with a stale copy.
export async function replaceGiverEntries(holderId, giverId, newEntries = []) {
  const ref = doc(db, "users", holderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = snap.data().proxies || [];
  const kept = current.filter((e) => e.proxyUserId !== giverId);
  if (kept.length === current.length && newEntries.length === 0) return;
  await updateDoc(ref, { proxies: [...kept, ...newEntries] });
}

// Base None/None entry always included so Free topics (and topics added later)
// go to the holder's choice; one extra entry per Yes/No/Abstain topic.
export function buildProxyEntries(giver, holder, topicIds, instructions) {
  const base = {
    principalId: holder.id,
    principalName: holder.displayName || "",
    proxyUserId: giver.id,
    proxyUserName: giver.displayName || "",
    proxyUserShares: Number(giver.shares) || 0,
  };
  const entries = [
    { proxyID: uuidv4(), ...base, topicId: "None", voteInstruction: "None" },
  ];
  for (const topicId of topicIds) {
    const instruction = instructions[topicId];
    if (instruction && instruction !== "free") {
      entries.push({
        proxyID: uuidv4(),
        ...base,
        topicId,
        voteInstruction: instruction,
      });
    }
  }
  return entries;
}

// castVote counts the share copy stored on each entry, so when a giver's shares
// (or name) are edited, refresh the copies on their holder's entries too.
export async function updateGiverDetails(holderId, giverId, { name, shares }) {
  const ref = doc(db, "users", holderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const proxies = (snap.data().proxies || []).map((e) =>
    e.proxyUserId === giverId
      ? { ...e, proxyUserName: name, proxyUserShares: shares }
      : e
  );
  await updateDoc(ref, { proxies });
}

export async function disableGiver(giverId) {
  await axios.post(`${NODE_API}/disableUser/${giverId}`);
}

// Lets a former giver sign in and vote directly again.
export async function releaseGiver(giverId) {
  await axios.post(`${NODE_API}/enableUser/${giverId}`);
  const ref = doc(db, "users", giverId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { proxyTo: deleteField() });
  }
}
