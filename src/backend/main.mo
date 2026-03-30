import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Data Structures
  type Client = {
    id : Nat;
    companyName : Text;
    contactName : Text;
    email : Text;
    phone : Text;
    address : Text;
    website : Text;
    createdAt : Time.Time;
  };

  type Project = {
    id : Nat;
    clientId : Nat;
    clientCompanyName : Text;
    projectHandleClient : Text;
    projectHandleTeam : Text;
    techDetails : Text;
    visitLocation : Text;
    status : {
      #pending;
      #completed;
      #cancelled;
    };
    visitDate : Time.Time;
    timeIn : Time.Time;
    timeOut : Time.Time;
    totalTime : Nat;
    clientAgreedRate : Nat;
    techAgreedRate : Nat;
    clientPaid : Bool;
    techPaid : Bool;
    travelCost : Nat;
    materialCost : Nat;
    profit : Nat;
    techBankDetails : Text;
    progress : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  module Project {
    public func compareByCreatedAt(a : Project, b : Project) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  type Task = {
    id : Nat;
    projectId : Nat;
    title : Text;
    description : Text;
    completed : Bool;
    hoursSpent : Nat;
    createdAt : Time.Time;
  };

  type InvoiceLineItem = {
    date : Time.Time;
    description : Text;
    visitTime : Nat;
    hourlyRate : Nat;
    travelCost : Nat;
    materialCost : Nat;
    totalAmount : Nat;
  };

  module InvoiceLineItem {
    public func compareByDate(a : InvoiceLineItem, b : InvoiceLineItem) : Order.Order {
      Int.compare(b.date, a.date);
    };
  };

  type Invoice = {
    id : Nat;
    projectId : Nat;
    invoiceNumber : Text;
    status : {
      #paid;
      #unpaid;
      #draft;
    };
    invoiceDate : Time.Time;
    invoiceMonth : Text;
    dueDate : Time.Time;
    paymentTerms : Text;
    costCenter : Text;
    clientCompanyName : Text;
    clientAddress : Text;
    clientPhone : Text;
    clientEmail : Text;
    clientWebsite : Text;
    ourCompanyName : Text;
    ourAddress : Text;
    ourPhone : Text;
    ourEmail : Text;
    ourWebsite : Text;
    lineItems : [InvoiceLineItem];
    subtotal : Nat;
    taxPercent : Nat;
    discountPercent : Nat;
    grandTotal : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  module Invoice {
    public func compareByCreatedAt(a : Invoice, b : Invoice) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  type Notification = {
    id : Nat;
    userId : Principal;
    title : Text;
    message : Text;
    notificationType : {
      #deadline;
      #payment;
      #info;
    };
    read : Bool;
    createdAt : Time.Time;
  };

  type CompanySettings = {
    companyName : Text;
    address : Text;
    phone : Text;
    email : Text;
    website : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  // State Variables
  var clientIdCounter = 0;
  var projectIdCounter = 0;
  var taskIdCounter = 0;
  var invoiceIdCounter = 0;
  var notificationIdCounter = 0;

  let clients = Map.empty<Nat, Client>();
  let projects = Map.empty<Nat, Project>();
  let tasks = Map.empty<Nat, Task>();
  let invoices = Map.empty<Nat, Invoice>();
  let notifications = Map.empty<Nat, Notification>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var companySettings : ?CompanySettings = null;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper Functions
  func getProjectInternal(projectId : Nat) : Project {
    switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) { project };
    };
  };

  // Client CRUD
  public shared ({ caller }) func createClient(input : Client) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create clients");
    };
    let newId = clientIdCounter;
    clientIdCounter += 1;
    let client : Client = {
      input with
      id = newId;
      createdAt = Time.now();
    };
    clients.add(newId, client);
    newId;
  };

  public query ({ caller }) func getClient(clientId : Nat) : async ?Client {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };
    clients.get(clientId);
  };

  public query ({ caller }) func listClients() : async [Client] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list clients");
    };
    let clientArray = clients.values().toArray();
    clientArray.sort(
      func(a : Client, b : Client) : Order.Order {
        Int.compare(b.createdAt, a.createdAt);
      },
    );
  };

  public shared ({ caller }) func updateClient(clientId : Nat, input : Client) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update clients");
    };
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
      case (?existing) {
        let updated : Client = {
          input with
          id = clientId;
          createdAt = existing.createdAt;
        };
        clients.add(clientId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteClient(clientId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete clients");
    };
    clients.remove(clientId);
  };

  func getClientInternal(clientId : Nat) : Client {
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) { client };
    };
  };

  // Project CRUD
  public shared ({ caller }) func createProject(input : Project) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };
    let newId = projectIdCounter;
    projectIdCounter += 1;
    let project : Project = {
      input with
      id = newId;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    projects.add(newId, project);
    newId;
  };

  public query ({ caller }) func getProject(projectId : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.get(projectId);
  };

  public query ({ caller }) func listProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list projects");
    };
    let projectArray = projects.values().toArray();
    projectArray.sort(Project.compareByCreatedAt);
  };

  public shared ({ caller }) func updateProject(projectId : Nat, input : Project) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?existing) {
        let updated : Project = {
          input with
          id = projectId;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        projects.add(projectId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteProject(projectId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };
    projects.remove(projectId);
  };

  // Task CRUD
  public shared ({ caller }) func createTask(input : Task) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };
    let newId = taskIdCounter;
    taskIdCounter += 1;
    let task : Task = {
      input with
      id = newId;
      createdAt = Time.now();
    };
    tasks.add(newId, task);
    newId;
  };

  public query ({ caller }) func getTask(taskId : Nat) : async ?Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    tasks.get(taskId);
  };

  public query ({ caller }) func listTasksByProject(projectId : Nat) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list tasks");
    };
    let taskArray = tasks.values().toArray().filter(
      func(task : Task) : Bool {
        task.projectId == projectId;
      }
    );
    taskArray.sort(
      func(a : Task, b : Task) : Order.Order {
        Int.compare(b.createdAt, a.createdAt);
      },
    );
  };

  public shared ({ caller }) func updateTask(taskId : Nat, input : Task) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existing) {
        let updated : Task = {
          input with
          id = taskId;
          createdAt = existing.createdAt;
        };
        tasks.add(taskId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };
    tasks.remove(taskId);
  };

  // Invoice CRUD
  public shared ({ caller }) func createInvoice(input : Invoice) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create invoices");
    };
    let newId = invoiceIdCounter;
    invoiceIdCounter += 1;
    let invoice : Invoice = {
      input with
      id = newId;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    invoices.add(newId, invoice);
    newId;
  };

  public query ({ caller }) func getInvoice(invoiceId : Nat) : async ?Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    invoices.get(invoiceId);
  };

  public query ({ caller }) func listInvoicesByProject(projectId : Nat) : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list invoices");
    };
    let invoiceArray = invoices.values().toArray().filter(
      func(invoice : Invoice) : Bool {
        invoice.projectId == projectId;
      }
    );
    invoiceArray.sort(Invoice.compareByCreatedAt);
  };

  public query ({ caller }) func listAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list invoices");
    };
    let invoiceArray = invoices.values().toArray();
    invoiceArray.sort(Invoice.compareByCreatedAt);
  };

  public shared ({ caller }) func updateInvoice(invoiceId : Nat, input : Invoice) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update invoices");
    };
    switch (invoices.get(invoiceId)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?existing) {
        let updated : Invoice = {
          input with
          id = invoiceId;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        invoices.add(invoiceId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteInvoice(invoiceId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete invoices");
    };
    invoices.remove(invoiceId);
  };

  // Notification CRUD
  public shared ({ caller }) func createNotification(notification : Notification) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create notifications");
    };
    let newId = notificationIdCounter;
    notificationIdCounter += 1;
    let newNotification : Notification = {
      notification with
      id = newId;
      createdAt = Time.now();
    };
    notifications.add(newId, newNotification);
    newId;
  };

  public query ({ caller }) func getNotificationsByUser(userId : Principal) : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    // Users can only view their own notifications, admins can view any
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notifications");
    };
    let notifArray = notifications.values().toArray().filter(
      func(notif : Notification) : Bool {
        notif.userId == userId;
      }
    );
    notifArray.sort(
      func(a : Notification, b : Notification) : Order.Order {
        Int.compare(b.createdAt, a.createdAt);
      },
    );
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    switch (notifications.get(notificationId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?existing) {
        // Users can only mark their own notifications as read
        if (caller != existing.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };
        let updated : Notification = {
          existing with
          read = true;
        };
        notifications.add(notificationId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteNotification(notificationId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete notifications");
    };
    switch (notifications.get(notificationId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?existing) {
        // Users can only delete their own notifications
        if (caller != existing.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own notifications");
        };
        notifications.remove(notificationId);
      };
    };
  };

  // Company Settings
  public shared ({ caller }) func updateCompanySettings(settings : CompanySettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update company settings");
    };
    companySettings := ?settings;
  };

  public query ({ caller }) func getCompanySettings() : async ?CompanySettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view company settings");
    };
    companySettings;
  };

  // Reports
  public query ({ caller }) func getMonthlyEarnings(month : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    var total : Nat = 0;
    for (invoice in invoices.values()) {
      if (invoice.invoiceMonth == month and invoice.status == #paid) {
        total += invoice.grandTotal;
      };
    };
    total;
  };

  public type ProjectPerformance = {
    pendingCount : Nat;
    completedCount : Nat;
    cancelledCount : Nat;
    totalProfit : Nat;
    averageProfit : Nat;
  };

  public query ({ caller }) func getProjectPerformance() : async ProjectPerformance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    var pendingCount = 0;
    var completedCount = 0;
    var cancelledCount = 0;
    var totalProfit : Nat = 0;
    var projectCount = 0;

    for (project in projects.values()) {
      projectCount += 1;
      totalProfit += project.profit;
      switch (project.status) {
        case (#pending) { pendingCount += 1 };
        case (#completed) { completedCount += 1 };
        case (#cancelled) { cancelledCount += 1 };
      };
    };

    let averageProfit = if (projectCount > 0) {
      totalProfit / projectCount;
    } else {
      0;
    };

    {
      pendingCount = pendingCount;
      completedCount = completedCount;
      cancelledCount = cancelledCount;
      totalProfit = totalProfit;
      averageProfit = averageProfit;
    };
  };

  public type ClientRevenue = {
    clientId : Nat;
    companyName : Text;
    totalRevenue : Nat;
  };

  public query ({ caller }) func getTopClientsByRevenue(limit : Nat) : async [ClientRevenue] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    
    // Calculate revenue per client
    let revenueMap = Map.empty<Nat, Nat>();
    for (project in projects.values()) {
      let currentRevenue = switch (revenueMap.get(project.clientId)) {
        case (null) { 0 };
        case (?rev) { rev };
      };
      revenueMap.add(project.clientId, currentRevenue + project.profit);
    };

    // Build result array
    var results : [ClientRevenue] = [];
    for ((clientId, revenue) in revenueMap.entries()) {
      switch (clients.get(clientId)) {
        case (null) {};
        case (?client) {
          results := results.concat([
            {
              clientId = clientId;
              companyName = client.companyName;
              totalRevenue = revenue;
            }
          ]);
        };
      };
    };

    // Sort by revenue descending
    let sorted = results.sort(
      func(a : ClientRevenue, b : ClientRevenue) : Order.Order {
        Nat.compare(b.totalRevenue, a.totalRevenue);
      },
    );

    // Return top N
    let resultLimit = Nat.min(limit, sorted.size());
    Array.tabulate(resultLimit, func(i : Nat) : ClientRevenue { sorted[i] });
  };
};
