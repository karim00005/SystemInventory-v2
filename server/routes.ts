import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertAccountSchema, insertProductSchema, insertCategorySchema, insertWarehouseSchema, insertTransactionSchema, insertInvoiceSchema, insertPurchaseSchema, insertUserSchema, insertSettingsSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { compare, hash } from "bcryptjs";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up user authentication
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sahl-app-secret",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: 'lax'
      },
      store: new MemoryStoreSession({
        checkPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
      }),
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport local strategy
  passport.use(
    new LocalStrategy.Strategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      // Hash password
      const hashedPassword = await hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Account routes
  app.post("/api/accounts", async (req, res) => {
    try {
      const data = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(data);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating account:", error);
        res.status(500).json({ message: "Error creating account" });
      }
    }
  });

  app.get("/api/accounts", async (req, res) => {
    try {
      const { type } = req.query;
      const accounts = await storage.listAccounts(type as string);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Error fetching accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Error fetching account" });
    }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      const data = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, data);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error updating account:", error);
        res.status(500).json({ message: "Error updating account" });
      }
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }
      const result = await storage.deleteAccount(id);
      if (!result) {
        return res.status(404).json({ message: "Account not found or could not be deleted" });
      }
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Error deleting account" });
    }
  });

  app.get("/api/accounts/search", async (req, res) => {
    try {
      const { query, type } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const accounts = await storage.searchAccounts(query as string, type as string);
      res.json(accounts);
    } catch (error) {
      console.error("Error searching accounts:", error);
      res.status(500).json({ message: "Error searching accounts" });
    }
  });

  // Category routes
  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Error creating category" });
      }
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Error fetching category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const data = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, data);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Error updating category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const result = await storage.deleteCategory(id);
      if (!result) {
        return res.status(404).json({ message: "Category not found or could not be deleted" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // Product routes
  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Error creating product" });
      }
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, data);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Error updating product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const result = await storage.deleteProduct(id);
      if (!result) {
        return res.status(404).json({ message: "Product not found or could not be deleted" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const products = await storage.searchProducts(query as string);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Error searching products" });
    }
  });

  // Warehouse routes
  app.post("/api/warehouses", async (req, res) => {
    try {
      const data = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(data);
      res.status(201).json(warehouse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating warehouse:", error);
        res.status(500).json({ message: "Error creating warehouse" });
      }
    }
  });

  app.get("/api/warehouses", async (req, res) => {
    try {
      const warehouses = await storage.listWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Error fetching warehouses" });
    }
  });

  app.get("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      const warehouse = await storage.getWarehouse(id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Error fetching warehouse" });
    }
  });

  app.put("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      const data = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(id, data);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error updating warehouse:", error);
        res.status(500).json({ message: "Error updating warehouse" });
      }
    }
  });

  app.delete("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      const result = await storage.deleteWarehouse(id);
      if (!result) {
        return res.status(404).json({ message: "Warehouse not found or could not be deleted" });
      }
      res.json({ message: "Warehouse deleted successfully" });
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Error deleting warehouse" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const { warehouseId } = req.query;
      let warehouseIdNumber: number | undefined;
      if (warehouseId) {
        warehouseIdNumber = parseInt(warehouseId as string);
        if (isNaN(warehouseIdNumber)) {
          return res.status(400).json({ message: "Invalid warehouse ID" });
        }
      }
      const inventory = await storage.listInventory(warehouseIdNumber);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Error fetching inventory" });
    }
  });

  app.get("/api/inventory/:productId/:warehouseId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const warehouseId = parseInt(req.params.warehouseId);
      if (isNaN(productId) || isNaN(warehouseId)) {
        return res.status(400).json({ message: "Invalid product or warehouse ID" });
      }
      const inv = await storage.getInventory(productId, warehouseId);
      if (!inv) {
        return res.status(404).json({ message: "Inventory record not found" });
      }
      res.json(inv);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Error fetching inventory" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const { productId, warehouseId, quantity } = req.body;
      if (!productId || !warehouseId || quantity === undefined) {
        return res.status(400).json({ message: "Product ID, warehouse ID, and quantity are required" });
      }
      const inv = await storage.updateInventory(productId, warehouseId, quantity);
      res.status(201).json(inv);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Error updating inventory" });
    }
  });

  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating transaction:", error);
        res.status(500).json({ message: "Error creating transaction" });
      }
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const { accountId, startDate, endDate } = req.query;
      let accountIdNumber: number | undefined;
      let startDateTime: Date | undefined;
      let endDateTime: Date | undefined;
      
      if (accountId) {
        accountIdNumber = parseInt(accountId as string);
        if (isNaN(accountIdNumber)) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
      }
      
      if (startDate) {
        startDateTime = new Date(startDate as string);
        if (isNaN(startDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid start date" });
        }
      }
      
      if (endDate) {
        endDateTime = new Date(endDate as string);
        if (isNaN(endDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid end date" });
        }
      }
      
      const transactions = await storage.listTransactions(accountIdNumber, startDateTime, endDateTime);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Error fetching transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      const result = await storage.deleteTransaction(id);
      if (!result) {
        return res.status(404).json({ message: "Transaction not found or could not be deleted" });
      }
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Error deleting transaction" });
    }
  });

  // Inventory transaction routes
  app.post("/api/inventory-transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createInventoryTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating inventory transaction:", error);
        res.status(500).json({ message: "Error creating inventory transaction" });
      }
    }
  });

  app.get("/api/inventory-transactions", async (req, res) => {
    try {
      const { productId, warehouseId } = req.query;
      let productIdNumber: number | undefined;
      let warehouseIdNumber: number | undefined;
      
      if (productId) {
        productIdNumber = parseInt(productId as string);
        if (isNaN(productIdNumber)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }
      }
      
      if (warehouseId) {
        warehouseIdNumber = parseInt(warehouseId as string);
        if (isNaN(warehouseIdNumber)) {
          return res.status(400).json({ message: "Invalid warehouse ID" });
        }
      }
      
      const transactions = await storage.listInventoryTransactions(productIdNumber, warehouseIdNumber);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching inventory transactions:", error);
      res.status(500).json({ message: "Error fetching inventory transactions" });
    }
  });

  // Invoice routes
  app.post("/api/invoices", async (req, res) => {
    try {
      const { invoice, details } = req.body;
      if (!invoice || !details || !Array.isArray(details)) {
        return res.status(400).json({ message: "Invoice and details array are required" });
      }
      
      const invoiceData = insertInvoiceSchema.parse(invoice);
      // Validate each detail item
      for (const detail of details) {
        if (!detail.productId || !detail.quantity || !detail.unitPrice || !detail.total) {
          return res.status(400).json({ message: "Each detail must include productId, quantity, unitPrice, and total" });
        }
      }
      
      const newInvoice = await storage.createInvoice(invoiceData, details);
      res.status(201).json(newInvoice);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Error creating invoice" });
      }
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const { accountId, startDate, endDate } = req.query;
      let accountIdNumber: number | undefined;
      let startDateTime: Date | undefined;
      let endDateTime: Date | undefined;
      
      if (accountId) {
        accountIdNumber = parseInt(accountId as string);
        if (isNaN(accountIdNumber)) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
      }
      
      if (startDate) {
        startDateTime = new Date(startDate as string);
        if (isNaN(startDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid start date" });
        }
      }
      
      if (endDate) {
        endDateTime = new Date(endDate as string);
        if (isNaN(endDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid end date" });
        }
      }
      
      const invoices = await storage.listInvoices(accountIdNumber, startDateTime, endDateTime);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Error fetching invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Error fetching invoice" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const invoice = await storage.updateInvoiceStatus(id, status);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Error updating invoice status" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      const result = await storage.deleteInvoice(id);
      if (!result) {
        return res.status(404).json({ message: "Invoice not found or could not be deleted" });
      }
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Error deleting invoice" });
    }
  });

  // Purchase routes
  app.post("/api/purchases", async (req, res) => {
    try {
      const { purchase, details } = req.body;
      if (!purchase || !details || !Array.isArray(details)) {
        return res.status(400).json({ message: "Purchase and details array are required" });
      }
      
      const purchaseData = insertPurchaseSchema.parse(purchase);
      // Validate each detail item
      for (const detail of details) {
        if (!detail.productId || !detail.quantity || !detail.unitPrice || !detail.total) {
          return res.status(400).json({ message: "Each detail must include productId, quantity, unitPrice, and total" });
        }
      }
      
      const newPurchase = await storage.createPurchase(purchaseData, details);
      res.status(201).json(newPurchase);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating purchase:", error);
        res.status(500).json({ message: "Error creating purchase" });
      }
    }
  });

  app.get("/api/purchases", async (req, res) => {
    try {
      const { accountId, startDate, endDate } = req.query;
      let accountIdNumber: number | undefined;
      let startDateTime: Date | undefined;
      let endDateTime: Date | undefined;
      
      if (accountId) {
        accountIdNumber = parseInt(accountId as string);
        if (isNaN(accountIdNumber)) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
      }
      
      if (startDate) {
        startDateTime = new Date(startDate as string);
        if (isNaN(startDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid start date" });
        }
      }
      
      if (endDate) {
        endDateTime = new Date(endDate as string);
        if (isNaN(endDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid end date" });
        }
      }
      
      const purchases = await storage.listPurchases(accountIdNumber, startDateTime, endDateTime);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Error fetching purchases" });
    }
  });

  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase ID" });
      }
      const purchase = await storage.getPurchase(id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      res.status(500).json({ message: "Error fetching purchase" });
    }
  });

  app.patch("/api/purchases/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase ID" });
      }
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const purchase = await storage.updatePurchaseStatus(id, status);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      console.error("Error updating purchase status:", error);
      res.status(500).json({ message: "Error updating purchase status" });
    }
  });

  app.delete("/api/purchases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase ID" });
      }
      const result = await storage.deletePurchase(id);
      if (!result) {
        return res.status(404).json({ message: "Purchase not found or could not be deleted" });
      }
      res.json({ message: "Purchase deleted successfully" });
    } catch (error) {
      console.error("Error deleting purchase:", error);
      res.status(500).json({ message: "Error deleting purchase" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const data = insertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Error updating settings" });
      }
    }
  });

  // Initialize admin user if no users exist
  try {
    const users = await storage.listUsers();
    if (users.length === 0) {
      const hashedPassword = await hash("admin", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        fullName: "System Administrator",
        role: "admin"
      });
      console.log("Created default admin user");
    }
  } catch (error) {
    console.error("Error checking/creating admin user:", error);
  }
  
  // Initialize default settings if not exist
  try {
    const settings = await storage.getSettings();
    if (!settings) {
      await storage.updateSettings({
        companyName: "شركة الريادي لتوزيع المواد الغذائية",
        address: "١٤ شارع نور مصر سالم",
        phone: "01006779000",
        currency: "EGP",
        currencySymbol: "ج.م",
      });
      console.log("Created default settings");
    }
  } catch (error) {
    console.error("Error checking/creating settings:", error);
  }

  // Initialize default warehouse if not exist
  try {
    const warehouses = await storage.listWarehouses();
    if (warehouses.length === 0) {
      await storage.createWarehouse({
        name: "المخزن الرئيسي",
        isDefault: true
      });
      console.log("Created default warehouse");
    }
  } catch (error) {
    console.error("Error checking/creating default warehouse:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
