<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import {
  createQuickPickItem,
  deleteQuickPickItem,
  getQuickPickItems,
  seedDefaultQuickPickItems,
  updateQuickPickItem,
  type QuickPickItem,
} from "../../api/quickPickItems";
import {
  cancelInvite,
  getInvites,
  removeInvite,
  resendInvite,
  sendInvite,
  type Invite,
  type InviteChannel,
  type InviteStatus,
} from "../../api/invites";
import {
  getOrgUsers,
  grantRole,
  revokeRole,
  type OrgUser,
  type UserRole,
} from "../../api/userAccess";
import { useToast } from "../../composables/useToast";
import { currentUser } from "../../stores/user";

const { showToast } = useToast();

// --- User Access state ---
const orgUsers = ref<OrgUser[]>([]);
const usersLoading = ref(false);
const usersError = ref<string | null>(null);
const grantingRoleUserId = ref<string | null>(null);
const revokingKey = ref<string | null>(null);
const pendingGrantRole = ref<Record<string, UserRole>>({});
const confirmRevoke = ref<{ userId: string; roleName: UserRole } | null>(null);

const isAdmin = computed(() => currentUser.value?.role === "admin");
const canViewUserAccess = computed(
  () => currentUser.value?.role === "admin" || currentUser.value?.role === "manager",
);

const ROLE_OPTIONS: UserRole[] = ["admin", "manager", "volunteer"];

function getPendingGrant(userId: string): UserRole {
  return pendingGrantRole.value[userId] ?? "volunteer";
}

function setPendingGrant(userId: string, role: UserRole) {
  pendingGrantRole.value = { ...pendingGrantRole.value, [userId]: role };
}

async function loadOrgUsers(): Promise<void> {
  if (!canViewUserAccess.value) {
    return;
  }

  usersLoading.value = true;
  usersError.value = null;

  try {
    orgUsers.value = await getOrgUsers();
  } catch {
    usersError.value = "Failed to load users.";
  } finally {
    usersLoading.value = false;
  }
}

async function grantRoleToUser(user: OrgUser): Promise<void> {
  const role = getPendingGrant(user.id);

  if (user.roles.includes(role)) {
    showToast(`${user.name} already has role "${role}"`);
    return;
  }

  grantingRoleUserId.value = user.id;
  usersError.value = null;

  try {
    const updated = await grantRole(user.id, role);
    orgUsers.value = orgUsers.value.map((u) => (u.id === updated.id ? updated : u));
    showToast(`Granted "${role}" to ${user.name}`);
  } catch (err) {
    usersError.value = getApiErrorMessage(err, "Failed to grant role.");
  } finally {
    grantingRoleUserId.value = null;
  }
}

function askRevokeRole(userId: string, roleName: string): void {
  confirmRevoke.value = { userId, roleName: roleName as UserRole };
}

function cancelRevokeRole(): void {
  confirmRevoke.value = null;
}

async function confirmRevokeRole(): Promise<void> {
  if (!confirmRevoke.value) {
    return;
  }

  const { userId, roleName } = confirmRevoke.value;
  const key = `${userId}:${roleName}`;
  revokingKey.value = key;
  usersError.value = null;
  confirmRevoke.value = null;

  try {
    const updated = await revokeRole(userId, roleName);
    orgUsers.value = orgUsers.value.map((u) => (u.id === updated.id ? updated : u));
    showToast(`Revoked "${roleName}"`);
  } catch (err) {
    usersError.value = getApiErrorMessage(err, "Failed to revoke role.");
  } finally {
    revokingKey.value = null;
  }
}

function roleClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-violet-100 text-violet-800";
    case "manager":
      return "bg-sky-100 text-sky-800";
    case "volunteer":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function membershipClass(status: string | undefined): string {
  return status === "active"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-200 text-slate-600";
}

const items = ref<QuickPickItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const newLabel = ref("");
const addingItem = ref(false);

const editingId = ref<string | null>(null);
const editingLabel = ref("");
const savingEditId = ref<string | null>(null);
const deletingId = ref<string | null>(null);

const invites = ref<Invite[]>([]);
const invitesLoading = ref(true);
const invitesError = ref<string | null>(null);
const inviteDestination = ref("");
const inviteChannel = ref<InviteChannel>("email");
const sendingInvite = ref(false);
const resendInviteId = ref<string | null>(null);
const cancelInviteId = ref<string | null>(null);
const removeInviteId = ref<string | null>(null);

function orgId(): string {
  return currentUser.value?.organization_id ?? "";
}

async function loadItems(): Promise<void> {
  const org = orgId();
  if (!org) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    items.value = await getQuickPickItems(org);
  } catch {
    error.value = "Failed to load quick pick items.";
  } finally {
    loading.value = false;
  }
}

async function loadInvites(): Promise<void> {
  invitesLoading.value = true;
  invitesError.value = null;

  try {
    invites.value = await getInvites();
  } catch {
    invitesError.value = "Failed to load invites.";
  } finally {
    invitesLoading.value = false;
  }
}

async function addItem(): Promise<void> {
  const label = newLabel.value.trim();
  if (!label || !orgId()) {
    return;
  }

  addingItem.value = true;
  error.value = null;

  try {
    const created = await createQuickPickItem(orgId(), label);
    items.value = [...items.value, created];
    newLabel.value = "";
    showToast(`Added "${created.label}"`);
  } catch {
    error.value = "Failed to add item. It may already exist.";
  } finally {
    addingItem.value = false;
  }
}

function startEdit(item: QuickPickItem): void {
  editingId.value = item.id;
  editingLabel.value = item.label;
}

function cancelEdit(): void {
  editingId.value = null;
  editingLabel.value = "";
}

async function saveEdit(item: QuickPickItem): Promise<void> {
  const label = editingLabel.value.trim();
  if (!label || !orgId()) {
    return;
  }

  savingEditId.value = item.id;
  error.value = null;

  try {
    const updated = await updateQuickPickItem(item.id, orgId(), { label });
    items.value = items.value.map((i) => (i.id === item.id ? updated : i));
    editingId.value = null;
    showToast("Item updated");
  } catch {
    error.value = "Failed to update item.";
  } finally {
    savingEditId.value = null;
  }
}

async function removeItem(item: QuickPickItem): Promise<void> {
  if (!orgId()) {
    return;
  }

  deletingId.value = item.id;
  error.value = null;

  try {
    await deleteQuickPickItem(item.id, orgId());
    items.value = items.value.filter((i) => i.id !== item.id);
    showToast(`Removed "${item.label}"`);
  } catch {
    error.value = "Failed to remove item.";
  } finally {
    deletingId.value = null;
  }
}

async function seedDefaults(): Promise<void> {
  if (!orgId()) {
    return;
  }

  try {
    await seedDefaultQuickPickItems(orgId());
    await loadItems();
    showToast("Default items added");
  } catch {
    error.value = "Failed to seed defaults.";
  }
}

function isValidDestination(value: string, channel: InviteChannel): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (channel === "email") {
    return trimmed.includes("@");
  }

  return trimmed.length >= 10;
}

function formatStatus(status: InviteStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "SENT":
      return "Sent";
    case "ACCEPTED":
      return "Accepted";
    case "EXPIRED":
      return "Expired";
    case "REVOKED":
      return "Canceled";
    default:
      return status;
  }
}

function statusClass(status: InviteStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "SENT":
      return "bg-sky-100 text-sky-800";
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-800";
    case "EXPIRED":
      return "bg-slate-200 text-slate-700";
    case "REVOKED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

async function sendInviteFromSettings(): Promise<void> {
  if (!isValidDestination(inviteDestination.value, inviteChannel.value)) {
    invitesError.value = inviteChannel.value === "email"
      ? "Enter a valid email address."
      : "Enter a valid phone number.";
    return;
  }

  sendingInvite.value = true;
  invitesError.value = null;

  try {
    await sendInvite(inviteDestination.value.trim(), inviteChannel.value);
    showToast("Invite sent");
    inviteDestination.value = "";
    await loadInvites();
  } catch (err) {
    invitesError.value = getApiErrorMessage(err, "Failed to send invite.");
  } finally {
    sendingInvite.value = false;
  }
}

async function resend(invite: Invite): Promise<void> {
  resendInviteId.value = invite.id;
  invitesError.value = null;

  try {
    await resendInvite(invite.id);
    showToast("Invite resent");
    await loadInvites();
  } catch (err) {
    invitesError.value = getApiErrorMessage(err, "Failed to resend invite.");
  } finally {
    resendInviteId.value = null;
  }
}

async function cancel(invite: Invite): Promise<void> {
  cancelInviteId.value = invite.id;
  invitesError.value = null;

  try {
    await cancelInvite(invite.id);
    showToast("Invite canceled");
    await loadInvites();
  } catch (err) {
    invitesError.value = getApiErrorMessage(err, "Failed to cancel invite.");
  } finally {
    cancelInviteId.value = null;
  }
}

async function remove(invite: Invite): Promise<void> {
  removeInviteId.value = invite.id;
  invitesError.value = null;

  try {
    await removeInvite(invite.id);
    showToast("Invite removed");
    invites.value = invites.value.filter((entry) => entry.id !== invite.id);
  } catch (err) {
    invitesError.value = getApiErrorMessage(err, "Failed to remove invite.");
  } finally {
    removeInviteId.value = null;
  }
}

function canResend(status: InviteStatus): boolean {
  return status !== "ACCEPTED";
}

function canCancel(status: InviteStatus): boolean {
  return status === "PENDING" || status === "SENT";
}

function canRemove(status: InviteStatus): boolean {
  return status === "REVOKED" || status === "EXPIRED" || status === "ACCEPTED";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "-" : date.toLocaleString();
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (Array.isArray(message)) {
        const first = message.find((entry) => typeof entry === "string" && entry.trim());
        if (typeof first === "string") {
          return first;
        }
      }
    }

    if (typeof err.message === "string" && err.message.trim()) {
      return err.message;
    }
  }

  return fallback;
}

onMounted(() => {
  void loadItems();
  void loadInvites();
  void loadOrgUsers();
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <h1 class="mb-6 text-2xl font-bold tracking-tight text-slate-900">Settings</h1>

    <!-- Quick Pick Items -->
    <div class="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Quick Pick Items</h2>
          <p class="mt-1 text-sm text-slate-500">
            These buttons appear in the New Request form for fast need entry.
          </p>
        </div>
        <button
          v-if="!loading && items.length === 0"
          type="button"
          class="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          @click="seedDefaults"
        >
          Add defaults
        </button>
      </div>

      <p v-if="error" class="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error }}</p>
      <p v-if="loading" class="text-sm text-slate-500">Loading...</p>

      <ul v-else class="mb-4 space-y-2">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
        >
          <!-- Edit mode -->
          <template v-if="editingId === item.id">
            <input
              v-model="editingLabel"
              type="text"
              class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              @keydown.enter="saveEdit(item)"
              @keydown.escape="cancelEdit"
            />
            <button
              type="button"
              class="min-h-[36px] rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              :disabled="savingEditId === item.id"
              @click="saveEdit(item)"
            >
              Save
            </button>
            <button
              type="button"
              class="min-h-[36px] rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </template>

          <!-- View mode -->
          <template v-else>
            <span class="flex-1 text-sm font-medium text-slate-800">{{ item.label }}</span>
            <button
              type="button"
              class="min-h-[36px] rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
              @click="startEdit(item)"
            >
              Edit
            </button>
            <button
              type="button"
              class="min-h-[36px] rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              :disabled="deletingId === item.id"
              @click="removeItem(item)"
            >
              {{ deletingId === item.id ? "Removing…" : "Remove" }}
            </button>
          </template>
        </li>

        <li v-if="!loading && items.length === 0" class="text-sm text-slate-500">
          No quick pick items yet.
        </li>
      </ul>

      <!-- Add new item row -->
      <div class="flex gap-2">
        <input
          v-model="newLabel"
          type="text"
          placeholder="e.g. jacket"
          class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          @keydown.enter="addItem"
        />
        <button
          type="button"
          class="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!newLabel.trim() || addingItem"
          @click="addItem"
        >
          Add
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-slate-900">Invite Management</h2>
        <p class="mt-1 text-sm text-slate-500">
          Send, track, resend, cancel, and remove email invites. SMS support can be added later.
        </p>
      </div>

      <p v-if="invitesError" class="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ invitesError }}</p>

      <div class="mb-4 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <select
          v-model="inviteChannel"
          class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="email">Email</option>
          <option value="sms" disabled>SMS (coming soon)</option>
        </select>
        <input
          v-model="inviteDestination"
          :type="inviteChannel === 'email' ? 'email' : 'text'"
          :placeholder="inviteChannel === 'email' ? 'name@example.com' : '+15555550123'"
          class="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          @keydown.enter="sendInviteFromSettings"
        />
        <button
          type="button"
          class="min-h-[44px] rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="sendingInvite || !isValidDestination(inviteDestination, inviteChannel)"
          @click="sendInviteFromSettings"
        >
          {{ sendingInvite ? "Sending..." : "Send invite" }}
        </button>
      </div>

      <p v-if="invitesLoading" class="text-sm text-slate-500">Loading invites...</p>

      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Destination</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Channel</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Expires</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="invite in invites" :key="invite.id">
              <td class="px-3 py-3 text-sm text-slate-800">{{ invite.destination }}</td>
              <td class="px-3 py-3 text-sm text-slate-600">{{ invite.channel.toUpperCase() }}</td>
              <td class="px-3 py-3 text-sm">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClass(invite.status)">
                  {{ formatStatus(invite.status) }}
                </span>
              </td>
              <td class="px-3 py-3 text-sm text-slate-600">{{ formatDate(invite.expires_at) }}</td>
              <td class="px-3 py-3 text-sm">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="canResend(invite.status)"
                    type="button"
                    class="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    :disabled="resendInviteId === invite.id"
                    @click="resend(invite)"
                  >
                    {{ resendInviteId === invite.id ? "Resending..." : "Resend" }}
                  </button>
                  <button
                    v-if="canCancel(invite.status)"
                    type="button"
                    class="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                    :disabled="cancelInviteId === invite.id"
                    @click="cancel(invite)"
                  >
                    {{ cancelInviteId === invite.id ? "Canceling..." : "Cancel" }}
                  </button>
                  <button
                    v-if="canRemove(invite.status)"
                    type="button"
                    class="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                    :disabled="removeInviteId === invite.id"
                    @click="remove(invite)"
                  >
                    {{ removeInviteId === invite.id ? "Removing..." : "Remove" }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="invites.length === 0">
              <td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500">No invites yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Access Management -->
    <div v-if="canViewUserAccess" class="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">User Access</h2>
          <p class="mt-1 text-sm text-slate-500">
            View and manage role assignments for members of your organization.
            <span v-if="!isAdmin" class="text-amber-700"> (Read-only — only admins can change roles.)</span>
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          :disabled="usersLoading"
          @click="loadOrgUsers"
        >
          {{ usersLoading ? "Loading…" : "Refresh" }}
        </button>
      </div>

      <p v-if="usersError" class="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {{ usersError }}
      </p>

      <!-- Revoke confirmation dialog -->
      <div
        v-if="confirmRevoke"
        class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <p class="mb-3 font-medium">
          Remove role <span class="font-bold">"{{ confirmRevoke.roleName }}"</span> from this user?
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            :disabled="revokingKey !== null"
            @click="confirmRevokeRole"
          >
            {{ revokingKey ? "Revoking…" : "Yes, revoke" }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100"
            @click="cancelRevokeRole"
          >
            Cancel
          </button>
        </div>
      </div>

      <p v-if="usersLoading" class="text-sm text-slate-500">Loading users…</p>

      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Contact</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Membership</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Roles</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Capabilities</th>
              <th v-if="isAdmin" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="user in orgUsers" :key="user.id">
              <td class="px-3 py-3 text-sm font-medium text-slate-800">{{ user.name }}</td>
              <td class="px-3 py-3 text-sm text-slate-600">
                <span v-if="user.email">{{ user.email }}</span>
                <span v-else-if="user.phone_number">{{ user.phone_number }}</span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-3 py-3 text-sm">
                <span
                  v-if="user.membership"
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="membershipClass(user.membership.status)"
                >
                  {{ user.membership.status }}
                </span>
                <span v-else class="text-xs text-slate-400">none</span>
              </td>
              <td class="px-3 py-3 text-sm">
                <div class="flex flex-wrap items-center gap-1">
                  <span
                    v-for="role in user.roles"
                    :key="role"
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="roleClass(role)"
                  >
                    {{ role }}
                    <button
                      v-if="isAdmin"
                      type="button"
                      class="ml-0.5 rounded-full transition hover:opacity-70 focus:outline-none"
                      :disabled="revokingKey === `${user.id}:${role}`"
                      :title="`Remove ${role} role`"
                      :aria-label="`Remove ${role} role from ${user.name}`"
                      @click="askRevokeRole(user.id, role)"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 2l8 8M10 2l-8 8" />
                      </svg>
                    </button>
                  </span>
                  <span v-if="user.roles.length === 0" class="text-xs text-slate-400">none</span>
                </div>
              </td>
              <td class="px-3 py-3 text-xs text-slate-600">
                <ul class="space-y-0.5">
                  <li v-if="user.capabilities.canManageUsers">
                    <span class="text-violet-700">✓</span> Manage users
                  </li>
                  <li v-if="user.capabilities.canManageRequests">
                    <span class="text-sky-700">✓</span> Manage requests
                  </li>
                  <li v-if="user.capabilities.canDeliverItems">
                    <span class="text-emerald-700">✓</span> Deliver items
                  </li>
                </ul>
              </td>
              <td v-if="isAdmin" class="px-3 py-3 text-sm">
                <div class="flex items-center gap-2">
                  <select
                    :value="getPendingGrant(user.id)"
                    class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    @change="setPendingGrant(user.id, ($event.target as HTMLSelectElement).value as UserRole)"
                  >
                    <option v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <button
                    type="button"
                    class="rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="grantingRoleUserId === user.id"
                    @click="grantRoleToUser(user)"
                  >
                    {{ grantingRoleUserId === user.id ? "Granting…" : "Grant" }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="orgUsers.length === 0 && !usersLoading">
              <td :colspan="isAdmin ? 6 : 5" class="px-3 py-6 text-center text-sm text-slate-500">
                No users found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
