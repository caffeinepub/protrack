import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Client {
    id: bigint;
    contactName: string;
    createdAt: Time;
    email: string;
    website: string;
    address: string;
    companyName: string;
    phone: string;
}
export type Time = bigint;
export interface ProjectPerformance {
    pendingCount: bigint;
    cancelledCount: bigint;
    completedCount: bigint;
    averageProfit: bigint;
    totalProfit: bigint;
}
export interface Notification {
    id: bigint;
    title: string;
    userId: Principal;
    notificationType: Variant_info_deadline_payment;
    createdAt: Time;
    read: boolean;
    message: string;
}
export interface Task {
    id: bigint;
    title: string;
    createdAt: Time;
    hoursSpent: bigint;
    completed: boolean;
    description: string;
    projectId: bigint;
}
export interface CompanySettings {
    email: string;
    website: string;
    address: string;
    companyName: string;
    phone: string;
}
export interface Invoice {
    id: bigint;
    status: Variant_paid_unpaid_draft;
    lineItems: Array<InvoiceLineItem>;
    ourCompanyName: string;
    taxPercent: bigint;
    clientWebsite: string;
    createdAt: Time;
    clientEmail: string;
    dueDate: Time;
    discountPercent: bigint;
    ourEmail: string;
    clientAddress: string;
    grandTotal: bigint;
    invoiceDate: Time;
    ourWebsite: string;
    updatedAt: Time;
    invoiceNumber: string;
    projectId: bigint;
    costCenter: string;
    clientPhone: string;
    ourAddress: string;
    ourPhone: string;
    paymentTerms: string;
    clientCompanyName: string;
    subtotal: bigint;
    invoiceMonth: string;
}
export interface Project {
    id: bigint;
    status: Variant_cancelled_pending_completed;
    clientId: bigint;
    techBankDetails: string;
    timeIn: Time;
    clientPaid: boolean;
    visitLocation: string;
    techAgreedRate: bigint;
    createdAt: Time;
    visitDate: Time;
    totalTime: bigint;
    projectHandleClient: string;
    updatedAt: Time;
    progress: bigint;
    techDetails: string;
    clientAgreedRate: bigint;
    travelCost: bigint;
    profit: bigint;
    timeOut: Time;
    materialCost: bigint;
    clientCompanyName: string;
    projectHandleTeam: string;
    techPaid: boolean;
}
export interface ClientRevenue {
    clientId: bigint;
    companyName: string;
    totalRevenue: bigint;
}
export interface UserProfile {
    name: string;
}
export interface UserEntry {
    principal: Principal;
    role: UserRole;
}
export interface InvoiceLineItem {
    date: Time;
    hourlyRate: bigint;
    visitTime: bigint;
    description: string;
    totalAmount: bigint;
    travelCost: bigint;
    materialCost: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_cancelled_pending_completed {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed"
}
export enum Variant_info_deadline_payment {
    info = "info",
    deadline = "deadline",
    payment = "payment"
}
export enum Variant_paid_unpaid_draft {
    paid = "paid",
    unpaid = "unpaid",
    draft = "draft"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClient(input: Client): Promise<bigint>;
    createInvoice(input: Invoice): Promise<bigint>;
    createNotification(notification: Notification): Promise<bigint>;
    createProject(input: Project): Promise<bigint>;
    createTask(input: Task): Promise<bigint>;
    deleteClient(clientId: bigint): Promise<void>;
    deleteInvoice(invoiceId: bigint): Promise<void>;
    deleteNotification(notificationId: bigint): Promise<void>;
    deleteProject(projectId: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClient(clientId: bigint): Promise<Client | null>;
    getCompanySettings(): Promise<CompanySettings | null>;
    getInvoice(invoiceId: bigint): Promise<Invoice | null>;
    getMonthlyEarnings(month: string): Promise<bigint>;
    getNotificationsByUser(userId: Principal): Promise<Array<Notification>>;
    getProject(projectId: bigint): Promise<Project | null>;
    getProjectPerformance(): Promise<ProjectPerformance>;
    getTask(taskId: bigint): Promise<Task | null>;
    getTopClientsByRevenue(limit: bigint): Promise<Array<ClientRevenue>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllInvoices(): Promise<Array<Invoice>>;
    listAllUsers(): Promise<Array<UserEntry>>;
    listClients(): Promise<Array<Client>>;
    listInvoicesByProject(projectId: bigint): Promise<Array<Invoice>>;
    listProjects(): Promise<Array<Project>>;
    listTasksByProject(projectId: bigint): Promise<Array<Task>>;
    markNotificationAsRead(notificationId: bigint): Promise<void>;
    registerCaller(): Promise<void>;
    removeUser(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateClient(clientId: bigint, input: Client): Promise<void>;
    updateCompanySettings(settings: CompanySettings): Promise<void>;
    updateInvoice(invoiceId: bigint, input: Invoice): Promise<void>;
    updateProject(projectId: bigint, input: Project): Promise<void>;
    updateTask(taskId: bigint, input: Task): Promise<void>;
}
