import { 
  Account, InsertAccount, 
  Product, InsertProduct, 
  Category, InsertCategory,
  Warehouse, InsertWarehouse,
  Inventory, InsertInventory,
  Transaction, InsertTransaction,
  InventoryTransaction, InsertInventoryTransaction,
  Invoice, InsertInvoice, InvoiceDetail, InsertInvoiceDetail,
  Purchase, InsertPurchase, PurchaseDetail, InsertPurchaseDetail,
  User, InsertUser, 
  Settings, InsertSettings,
  accounts, products, categories, warehouses, inventory, 
  transactions, inventoryTransactions, invoices, invoiceDetails,
  purchases, purchaseDetails, users, settings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, like, desc, gte, lte, SQL, sql, count } from "drizzle-orm";

// interface defining all operations for our storage
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Accounts
  createAccount(account: InsertAccount): Promise<Account>;
  getAccount(id: number): Promise<Account | undefined>;
  listAccounts(type?: string): Promise<Account[]>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  searchAccounts(query: string, type?: string): Promise<Account[]>;
  getAccountStatement(accountId: number, startDate?: Date, endDate?: Date): Promise<any>;

  // Categories
  createCategory(category: InsertCategory): Promise<Category>;
  getCategory(id: number): Promise<Category | undefined>;
  listCategories(): Promise<Category[]>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  countCategories(): Promise<number>;

  // Products
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  listProducts(): Promise<Product[]>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  countProducts(): Promise<number>;

  // Warehouses
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  listWarehouses(): Promise<Warehouse[]>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: number): Promise<boolean>;

  // Inventory
  getInventory(productId: number, warehouseId: number): Promise<Inventory | undefined>;
  listInventory(warehouseId?: number): Promise<any[]>;
  updateInventory(productId: number, warehouseId: number, quantity: number, isAbsoluteValue?: boolean): Promise<Inventory>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  listTransactions(accountId?: number, startDate?: Date, endDate?: Date): Promise<Transaction[]>;
  deleteTransaction(id: number): Promise<boolean>;

  // Inventory Transactions
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  listInventoryTransactions(productId?: number, warehouseId?: number): Promise<InventoryTransaction[]>;
  
  // Invoices
  createInvoice(invoice: InsertInvoice, details: InsertInvoiceDetail[]): Promise<Invoice>;
  getInvoice(id: number): Promise<{invoice: Invoice, details: InvoiceDetail[]} | undefined>;
  listInvoices(accountId?: number, startDate?: Date, endDate?: Date): Promise<Invoice[]>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Purchases
  createPurchase(purchase: InsertPurchase, details: InsertPurchaseDetail[]): Promise<Purchase>;
  getPurchase(id: number): Promise<{purchase: Purchase, details: PurchaseDetail[]} | undefined>;
  listPurchases(accountId?: number, startDate?: Date, endDate?: Date): Promise<Purchase[]>;
  updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined>;
  deletePurchase(id: number): Promise<boolean>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // New method
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, details?: any[]): Promise<Invoice | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Accounts
  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values({ ...account, currentBalance: account.openingBalance || 0 })
      .returning();
    return newAccount;
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async listAccounts(type?: string): Promise<Account[]> {
    if (type) {
      return await db.select().from(accounts).where(eq(accounts.type, type)).orderBy(accounts.name);
    }
    return await db.select().from(accounts).orderBy(accounts.name);
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    try {
      await db.delete(accounts).where(eq(accounts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  }

  async searchAccounts(query: string, type?: string): Promise<Account[]> {
    if (type) {
      return await db
        .select()
        .from(accounts)
        .where(and(
          like(accounts.name, `%${query}%`),
          eq(accounts.type, type)
        ))
        .orderBy(accounts.name);
    }
    return await db
      .select()
      .from(accounts)
      .where(like(accounts.name, `%${query}%`))
      .orderBy(accounts.name);
  }

  async getAccountStatement(accountId: number, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      // Get the account details
      const account = await this.getAccount(accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      
      // Query to get transactions for this account in the date range
      let transactionsQuery = db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, accountId))
        .orderBy(transactions.date);
      
      if (startDate) {
        transactionsQuery = transactionsQuery.where(gte(transactions.date, startDate));
      }
      
      if (endDate) {
        transactionsQuery = transactionsQuery.where(lte(transactions.date, endDate));
      }
      
      const accountTransactions = await transactionsQuery;
      
      // Query to get invoices for this account in the date range
      let invoicesQuery = db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          date: invoices.date,
          dueDate: invoices.dueDate,
          accountId: invoices.accountId,
          total: invoices.total,
          status: invoices.status
        })
        .from(invoices)
        .where(eq(invoices.accountId, accountId))
        .orderBy(invoices.date);
        
      if (startDate) {
        invoicesQuery = invoicesQuery.where(gte(invoices.date, startDate));
      }
      
      if (endDate) {
        invoicesQuery = invoicesQuery.where(lte(invoices.date, endDate));
      }
      
      const accountInvoices = await invoicesQuery;
      
      // Calculate the starting balance - sum of all transactions before the start date
      let startingBalance = account.openingBalance || 0;
      if (startDate) {
        const previousTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.accountId, accountId),
              lte(transactions.date, startDate)
            )
          );
          
        for (const transaction of previousTransactions) {
          if (transaction.type === 'credit') {
            startingBalance -= transaction.amount;
          } else {
            startingBalance += transaction.amount;
          }
        }
      }
      
      // Combine and format transactions for the statement
      let statementItems = [];
      let runningBalance = startingBalance;
      
      // Add transactions
      for (const transaction of accountTransactions) {
        const amount = transaction.amount;
        const isDebit = transaction.type === 'debit' || (transaction.type === 'journal' && transaction.isDebit);
        
        if (isDebit) {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
        
        statementItems.push({
          date: transaction.date,
          type: transaction.type,
          isDebit: isDebit,
          reference: transaction.reference || '',
          description: transaction.notes || '',
          amount: amount,
          balance: runningBalance
        });
      }
      
      // Add invoices (only if they're not already represented by a transaction)
      for (const invoice of accountInvoices) {
        // Check if this invoice already has a corresponding transaction
        const existingTransaction = accountTransactions.find(t => 
          t.reference === invoice.invoiceNumber
        );
        
        if (!existingTransaction) {
          const isPurchase = invoice.invoiceNumber.startsWith('PUR-');
          // Handle account type safely to avoid type errors
          const accountType = account.type as string;
          const isDebit = (accountType === 'customer' && !isPurchase) || (accountType === 'supplier' && isPurchase);
          
          if (isDebit) {
            runningBalance += invoice.total;
          } else {
            runningBalance -= invoice.total;
          }
          
          statementItems.push({
            date: invoice.date,
            type: isPurchase ? 'purchase' : 'invoice',
            isDebit: isDebit,
            reference: invoice.invoiceNumber,
            description: isPurchase ? 'فاتورة مشتريات' : 'فاتورة مبيعات',
            amount: invoice.total,
            balance: runningBalance
          });
        }
      }
      
      // Sort by date
      statementItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate totals
      let totalDebits = 0;
      let totalCredits = 0;
      
      for (const item of statementItems) {
        if (item.isDebit) {
          totalDebits += item.amount;
        } else {
          totalCredits += item.amount;
        }
      }
      
      return {
        account: {
          id: account.id,
          name: account.name,
          type: account.type,
          code: account.code,
          email: account.email,
          phone: account.phone
        },
        startingBalance,
        endingBalance: runningBalance,
        totalDebits,
        totalCredits,
        netChange: totalDebits - totalCredits,
        transactions: statementItems,
        periodStart: startDate ? startDate.toISOString() : null,
        periodEnd: endDate ? endDate.toISOString() : null,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating account statement:", error);
      throw error;
    }
  }

  // Categories
  async createCategory(category: InsertCategory): Promise<Category> {
    // If this category is set as default, unset any existing default categories
    if (category.isDefault) {
      await db.update(categories)
        .set({ isDefault: false })
        .where(eq(categories.isDefault, true));
    }
    
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    // If this category is being set as default, unset any existing default categories
    if (category.isDefault) {
      await db.update(categories)
        .set({ isDefault: false })
        .where(eq(categories.isDefault, true));
    }
    
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  // Products
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.code, code));
    return product;
  }

  async listProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      // First check if this product is used in any invoice or purchase
      const [invoiceCheck] = await db.select({ count: sql`count(*)` })
        .from(invoiceDetails)
        .where(eq(invoiceDetails.productId, id));
      
      if (invoiceCheck.count > 0) {
        console.error(`Cannot delete product ${id}: Referenced in invoice_details`);
        return false;
      }
      
      const [purchaseCheck] = await db.select({ count: sql`count(*)` })
        .from(purchaseDetails)
        .where(eq(purchaseDetails.productId, id));
      
      if (purchaseCheck.count > 0) {
        console.error(`Cannot delete product ${id}: Referenced in purchase_details`);
        return false;
      }

      // Use a transaction to delete all related records and the product
      await db.transaction(async (tx) => {
        // First delete any related inventory records
        await tx.delete(inventory).where(eq(inventory.productId, id));
        
        // Then delete the related inventory transactions
        await tx.delete(inventoryTransactions).where(eq(inventoryTransactions.productId, id));
        
        // Finally delete the product
        await tx.delete(products).where(eq(products.id, id));
      });
      
      // Return success if no errors
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, `%${query}%`),
          like(products.code, `%${query}%`),
          like(products.barcode, `%${query}%`)
        )
      )
      .orderBy(products.name);
  }

  // Warehouses
  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return newWarehouse;
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async listWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).orderBy(warehouses.name);
  }

  async updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set({ ...warehouse, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    try {
      await db.delete(warehouses).where(eq(warehouses.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      return false;
    }
  }

  // Inventory
  async getInventory(productId: number, warehouseId: number): Promise<Inventory | undefined> {
    const [inv] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.warehouseId, warehouseId)
        )
      );
    return inv;
  }

  async listInventory(warehouseId?: number): Promise<any[]> {
    let query = db
      .select({
        id: inventory.id,
        productId: products.id,
        productName: products.name,
        productCode: products.code,
        warehouseId: warehouses.id,
        warehouseName: warehouses.name,
        quantity: inventory.quantity,
        costPrice: products.costPrice,
        sellPrice: products.sellPrice1,
        value: sql`${inventory.quantity} * ${products.costPrice}`,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id));
    
    if (warehouseId) {
      query = query.where(eq(inventory.warehouseId, warehouseId));
    }
    
    return await query;
  }

  async updateInventory(productId: number, warehouseId: number, quantity: number, isAbsoluteValue?: boolean): Promise<Inventory> {
    const existingInventory = await this.getInventory(productId, warehouseId);
    const useAbsoluteValue = isAbsoluteValue === true; // Default to false if undefined
    
    if (existingInventory) {
      // Update existing inventory
      let newQuantity: number;
      
      if (useAbsoluteValue) {
        // For count operations, set the quantity directly
        newQuantity = quantity;
      } else {
        // For adjustments, add/subtract from existing quantity
        newQuantity = (existingInventory.quantity || 0) + quantity;
      }
      
      const [updatedInventory] = await db
        .update(inventory)
        .set({ 
          quantity: newQuantity, 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(inventory.productId, productId),
            eq(inventory.warehouseId, warehouseId)
          )
        )
        .returning();
      
      // Add transaction record
      await this.createInventoryTransaction({
        productId,
        warehouseId,
        quantity: useAbsoluteValue ? quantity - (existingInventory.quantity || 0) : quantity,
        type: 'adjustment',
        date: new Date(),
        notes: useAbsoluteValue ? 'Quantity count adjustment' : (quantity > 0 ? 'Addition' : 'Reduction')
      });
      
      return updatedInventory;
    } else {
      // Create new inventory record
      const [newInventory] = await db
        .insert(inventory)
        .values({
          productId,
          warehouseId,
          quantity,
        })
        .returning();
      
      // Add transaction record
      await this.createInventoryTransaction({
        productId,
        warehouseId,
        quantity,
        type: 'adjustment',
        date: new Date(),
        notes: useAbsoluteValue ? 'Initial count' : 'Initial stock'
      });
      
      return newInventory;
    }
  }

  // Transactions
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    // Update account balance
    const account = await this.getAccount(transaction.accountId);
    if (account) {
      let newBalance = account.currentBalance;
      if (transaction.type === 'debit') {
        newBalance -= transaction.amount;
      } else {
        newBalance += transaction.amount;
      }
      
      await db
        .update(accounts)
        .set({ 
          currentBalance: newBalance, 
          updatedAt: new Date() 
        })
        .where(eq(accounts.id, transaction.accountId));
    }
    
    return newTransaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async listTransactions(accountId?: number, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    let query = db.select().from(transactions);
    
    const conditions: SQL[] = [];
    
    if (accountId) {
      conditions.push(eq(transactions.accountId, accountId));
    }
    
    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(transactions.date));
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      // Get transaction first to update account balance
      const transaction = await this.getTransaction(id);
      if (transaction) {
        const account = await this.getAccount(transaction.accountId);
        if (account) {
          let newBalance = account.currentBalance;
          // Reverse the effect
          if (transaction.type === 'debit') {
            newBalance += transaction.amount;
          } else {
            newBalance -= transaction.amount;
          }
          
          await db
            .update(accounts)
            .set({ 
              currentBalance: newBalance, 
              updatedAt: new Date() 
            })
            .where(eq(accounts.id, transaction.accountId));
        }
      }
      
      await db.delete(transactions).where(eq(transactions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  // Inventory Transactions
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [newTransaction] = await db.insert(inventoryTransactions).values(transaction).returning();
    
    // Update inventory
    let quantity = transaction.quantity;
    if (['sale', 'transfer_out'].includes(transaction.type)) {
      quantity = -quantity; // Decrease inventory for sales and transfers out
    }
    
    await this.updateInventory(
      transaction.productId,
      transaction.warehouseId,
      quantity
    );
    
    // For transfers, update the destination warehouse
    if (transaction.type === 'transfer' && transaction.notes) {
      try {
        const destinationWarehouseId = parseInt(transaction.notes);
        if (!isNaN(destinationWarehouseId)) {
          await this.updateInventory(
            transaction.productId,
            destinationWarehouseId,
            transaction.quantity
          );
        }
      } catch (error) {
        console.error('Error processing transfer:', error);
      }
    }
    
    return newTransaction;
  }

  async listInventoryTransactions(productId?: number, warehouseId?: number): Promise<InventoryTransaction[]> {
    let query = db.select().from(inventoryTransactions);
    
    const conditions: SQL[] = [];
    
    if (productId) {
      conditions.push(eq(inventoryTransactions.productId, productId));
    }
    
    if (warehouseId) {
      conditions.push(eq(inventoryTransactions.warehouseId, warehouseId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(inventoryTransactions.date));
  }

  // Invoices
  async createInvoice(invoice: InsertInvoice, details: InsertInvoiceDetail[]): Promise<Invoice> {
    const { status } = invoice;
    
    return await db.transaction(async (tx: any) => {
      try {
        // Calculate totals
        let subtotal = 0;
        details.forEach(detail => {
          subtotal += detail.quantity * detail.unitPrice;
        });
        
        const discount = invoice.discount || 0;
        const tax = invoice.tax || 0;
        const total = subtotal - discount + tax;
        
        const isPurchase = invoice.invoiceNumber?.startsWith('PUR');
        const transactionType = isPurchase ? 'purchase' : 'sale';
        
        // Log invoice details when status is 'posted'
        if (status === 'posted') {
          console.log(`Creating POSTED ${isPurchase ? 'purchase' : 'sales'} invoice: ${invoice.invoiceNumber} for accountId: ${invoice.accountId}, warehouseId: ${invoice.warehouseId}`);
          console.log(`Invoice contains ${details.length} items with total value: ${total}`);

          // Validate required fields for posted invoices
          if (!invoice.accountId) {
            throw new Error(`Account ID is required for posted ${isPurchase ? 'purchase' : 'sales'} invoices`);
          }

          if (!invoice.warehouseId) {
            throw new Error(`Warehouse ID is required for posted ${isPurchase ? 'purchase' : 'sales'} invoices`);
          }
        }
        
        // Create the invoice
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            ...invoice,
            subtotal,
            discount,
            tax,
            total,
          })
          .returning();
          
        console.log(`Created ${isPurchase ? 'purchase' : 'sales'} invoice with ID: ${newInvoice.id}`);

        // Create the invoice details
        for (const detail of details) {
          await tx
            .insert(invoiceDetails)
            .values({
              ...detail,
              invoiceId: newInvoice.id,
            });
        }
        
        // If invoice is posted (not draft), update inventory and create transactions
        if (status === 'posted') {
          // Process inventory updates
          for (const detail of details) {
            try {
              const productId = detail.productId;
              const warehouseId = invoice.warehouseId;
              const quantity = detail.quantity;
              
              // Validate product existence
              const [product] = await tx
                .select()
                .from(products)
                .where(eq(products.id, productId));
              
              if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
              }
              
              // For sales invoices, decrease inventory
              // For purchase invoices, increase inventory
              let quantityChange = isPurchase ? quantity : -quantity;
              
              console.log(`Creating inventory transaction: ${transactionType} of ${Math.abs(quantityChange)} units of product ${product.name} (ID: ${productId})`);
              
              // Create inventory transaction
              await tx.insert(inventoryTransactions).values({
                productId,
                warehouseId,
                quantity: Math.abs(quantity), // Always positive in the transaction record
                type: isPurchase ? 'purchase' : 'sale',
                documentId: newInvoice.id,
                documentType: 'invoice',
                date: new Date(),
                notes: `${isPurchase ? 'Purchase' : 'Sales'} Invoice #${newInvoice.invoiceNumber}`,
                userId: invoice.userId
              });
              
              // Update inventory
              const existingInventory = await this.getInventory(productId, warehouseId);
              
              if (existingInventory) {
                // Update existing inventory record
                const currentQuantity = existingInventory.quantity || 0;
                const newQuantity = currentQuantity + quantityChange;
                
                console.log(`Updating inventory for product ${productId}: ${currentQuantity} ${quantityChange >= 0 ? '+' : '-'} ${Math.abs(quantityChange)} = ${newQuantity}`);
                
                // For sales invoices, ensure we have enough stock
                if (!isPurchase && currentQuantity < quantity) {
                  throw new Error(`Not enough stock for product ${product.name}. Available: ${currentQuantity}, Required: ${quantity}`);
                }
                
                await tx
                  .update(inventory)
                  .set({ 
                    quantity: newQuantity, 
                    updatedAt: new Date() 
                  })
                  .where(
                    and(
                      eq(inventory.productId, productId),
                      eq(inventory.warehouseId, warehouseId)
                    )
                  );
              } else {
                // For sales invoices, we can't sell what we don't have
                if (!isPurchase) {
                  throw new Error(`No inventory record found for product ${product.name} in the selected warehouse. Cannot sell items that are not in stock.`);
                }
                
                // Create new inventory record for purchases
                console.log(`Creating new inventory record for product ${productId} with quantity ${quantity}`);
                
                await tx
                  .insert(inventory)
                  .values({
                    productId,
                    warehouseId,
                    quantity: quantityChange,
                  });
              }
            } catch (error) {
              console.error(`Error updating inventory for product ${detail.productId}:`, error);
              throw new Error(`Failed to update inventory for product ${detail.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          
          // Create financial transaction for the invoice if it's posted and has accountId
          if (invoice.accountId) {
            try {
              console.log(`Creating financial transaction for ${isPurchase ? 'purchase' : 'sales'} invoice ${newInvoice.id}`);
              
              // For sales invoices, the customer owes us money (debit account balance increases)
              // For purchase invoices, we owe the supplier money (credit account balance increases)
              const transactionType = isPurchase ? 'credit' : 'debit';
              
              await tx.insert(transactions).values({
                accountId: invoice.accountId,
                amount: total,
                type: transactionType as 'credit' | 'debit' | 'journal',
                reference: newInvoice.invoiceNumber,
                date: invoice.date || new Date(),
                documentId: newInvoice.id,
                documentType: 'invoice',
                userId: invoice.userId,
                notes: `${isPurchase ? 'Purchase' : 'Sales'} Invoice #${newInvoice.invoiceNumber}`
              });
              
              // Update account balance
              const [account] = await tx
                .select()
                .from(accounts)
                .where(eq(accounts.id, invoice.accountId));
              
              if (account) {
                const currentBalance = account.currentBalance || 0;
                let newBalance: number;
                
                // For sales: increase customer's debit (they owe us money)
                // For purchases: increase supplier's credit (we owe them money)
                if (isPurchase) {
                  newBalance = currentBalance - total; // Credit: negative means we owe them
                } else {
                  newBalance = currentBalance + total; // Debit: positive means they owe us
                }
                
                console.log(`Updating account ${invoice.accountId} balance: ${currentBalance} ${isPurchase ? '-' : '+'} ${total} = ${newBalance}`);
                
                await tx
                  .update(accounts)
                  .set({ 
                    currentBalance: newBalance,
                    updatedAt: new Date()
                  })
                  .where(eq(accounts.id, invoice.accountId));
              } else {
                throw new Error(`Account with ID ${invoice.accountId} not found`);
              }
            } catch (error) {
              console.error(`Error creating financial transaction for ${isPurchase ? 'purchase' : 'sales'} invoice ${newInvoice.id}:`, error);
              throw new Error(`Failed to create financial transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
        
        console.log(`${isPurchase ? 'Purchase' : 'Sales'} invoice processing completed successfully for ID: ${newInvoice.id}`);
        return newInvoice;
      } catch (error) {
        console.error(`Error in create${invoice.invoiceNumber?.startsWith('PUR') ? 'Purchase' : 'Sales'} transaction:`, error);
        throw error; // Rethrow the error to trigger transaction rollback
      }
    });
  }

  async getInvoice(id: number): Promise<{invoice: Invoice, details: InvoiceDetail[]} | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) {
      return undefined;
    }
    
    const details = await db
      .select()
      .from(invoiceDetails)
      .where(eq(invoiceDetails.invoiceId, id));
    
    return { invoice, details };
  }

  async listInvoices(accountId?: number, startDate?: Date, endDate?: Date): Promise<Invoice[]> {
    let query = db.select().from(invoices);
    
    const conditions: SQL[] = [];
    
    if (accountId) {
      conditions.push(eq(invoices.accountId, accountId));
    }
    
    if (startDate) {
      conditions.push(gte(invoices.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(invoices.date, endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(invoices.date));
  }

  async listInvoicesWithDetails(accountId?: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    // First get all invoices
    let invoicesQuery = db.select().from(invoices);
    
    const conditions: SQL[] = [];
    
    if (accountId) {
      conditions.push(eq(invoices.accountId, accountId));
    }
    
    if (startDate) {
      conditions.push(gte(invoices.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(invoices.date, endDate));
    }
    
    if (conditions.length > 0) {
      invoicesQuery = invoicesQuery.where(and(...conditions));
    }
    
    const allInvoices = await invoicesQuery.orderBy(desc(invoices.date));
    
    // Then get details for all invoices
    const allDetails = await db
      .select()
      .from(invoiceDetails)
      .where(inArray(invoiceDetails.invoiceId, allInvoices.map(inv => inv.id)));
    
    // Combine invoices with their details
    return allInvoices.map(invoice => ({
      ...invoice,
      details: allDetails.filter(detail => detail.invoiceId === invoice.id)
    }));
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return await db.transaction(async (tx: any) => {
      try {
        // Get invoice to update account balance
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, id));
        
        if (invoice && invoice.status === 'posted') {
          // Delete related inventory transactions
          await tx
            .delete(inventoryTransactions)
            .where(
              and(
                eq(inventoryTransactions.documentId, id),
                eq(inventoryTransactions.documentType, 'invoice')
              )
            );
          
          // Restore inventory
          const details = await tx
            .select()
            .from(invoiceDetails)
            .where(eq(invoiceDetails.invoiceId, id));
          
          for (const detail of details) {
            const [invRecord] = await tx
              .select()
              .from(inventory)
              .where(
                and(
                  eq(inventory.productId, detail.productId),
                  eq(inventory.warehouseId, invoice.warehouseId)
                )
              );
            
            if (invRecord) {
              await tx
                .update(inventory)
                .set({ 
                  quantity: invRecord.quantity + detail.quantity,
                  updatedAt: new Date()
                })
                .where(eq(inventory.id, invRecord.id));
            } else {
              await tx
                .insert(inventory)
                .values({
                  productId: detail.productId,
                  warehouseId: invoice.warehouseId,
                  quantity: detail.quantity
                });
            }
          }
          
          // Delete financial transaction
          const [transaction] = await tx
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.documentId, id),
                eq(transactions.documentType, 'invoice')
              )
            );
          
          if (transaction) {
            await tx.delete(transactions).where(eq(transactions.id, transaction.id));
            
            // Update account balance
            if (invoice.accountId) {
              const [account] = await tx
                .select()
                .from(accounts)
                .where(eq(accounts.id, invoice.accountId));
              
              if (account) {
                await tx
                  .update(accounts)
                  .set({ 
                    currentBalance: account.currentBalance - invoice.total,
                    updatedAt: new Date()
                  })
                  .where(eq(accounts.id, invoice.accountId));
              }
            }
          }
        }
        
        // Delete invoice details
        await tx
          .delete(invoiceDetails)
          .where(eq(invoiceDetails.invoiceId, id));
        
        // Delete invoice
        await tx
          .delete(invoices)
          .where(eq(invoices.id, id));
        
        return true;
      } catch (error) {
        console.error('Error deleting invoice:', error);
        return false;
      }
    });
  }

  // Purchases
  async createPurchase(purchase: InsertPurchase, details: InsertPurchaseDetail[]): Promise<Purchase> {
    // Start a transaction
    return await db.transaction(async (tx: any) => {
      try {
        // Calculate totals for the purchase
        let subtotal = 0;
        details.forEach(detail => {
          subtotal += detail.quantity * detail.unitPrice;
        });
        
        const discount = purchase.discount || 0;
        const tax = purchase.tax || 0;
        const total = subtotal - discount + tax;
        
        // Update the purchase with calculated totals
        const updatedPurchase = {
          ...purchase,
          subtotal,
          discount,
          tax,
          total
        };

        // Log purchase details when status is 'posted'
        if (purchase.status === 'posted') {
          console.log(`Creating POSTED purchase invoice: ${purchase.purchaseNumber} for accountId: ${purchase.accountId}, warehouseId: ${purchase.warehouseId}`);
          console.log(`Purchase contains ${details.length} items with total value: ${total}`);

          // Validate required fields for posted purchases
          if (!purchase.accountId) {
            throw new Error("Account ID is required for posted purchases");
          }

          if (!purchase.warehouseId) {
            throw new Error("Warehouse ID is required for posted purchases");
          }
        }
        
        // Create purchase
        const [newPurchase] = await tx.insert(purchases).values(updatedPurchase).returning();
        console.log(`Created purchase with ID: ${newPurchase.id}`);
        
        // Create purchase details with the new purchase ID
        for (const detail of details) {
          await tx.insert(purchaseDetails).values({
            ...detail,
            purchaseId: newPurchase.id
          });
          
          // Create inventory transaction for each product if purchase is posted
          if (purchase.status === 'posted') {
            try {
              // Validate product existence
              const [product] = await tx
                .select()
                .from(products)
                .where(eq(products.id, detail.productId));
              
              if (!product) {
                throw new Error(`Product with ID ${detail.productId} not found`);
              }

              console.log(`Processing inventory update for product: ${product.name} (ID: ${detail.productId}), quantity: ${detail.quantity}`);
              
              await tx.insert(inventoryTransactions).values({
                productId: detail.productId,
                warehouseId: purchase.warehouseId,
                quantity: detail.quantity,
                type: 'purchase',
                documentId: newPurchase.id,
                documentType: 'purchase',
                date: purchase.date || new Date(),
                userId: purchase.userId,
                notes: `Purchase #${purchase.purchaseNumber}`
              });
              
              // Update inventory
              const existingInventory = await tx
                .select()
                .from(inventory)
                .where(
                  and(
                    eq(inventory.productId, detail.productId),
                    eq(inventory.warehouseId, purchase.warehouseId)
                  )
                );
              
              if (existingInventory.length > 0) {
                const currentQuantity = existingInventory[0].quantity || 0;
                const newQuantity = currentQuantity + detail.quantity;
                
                console.log(`Updating inventory for product ${detail.productId}: ${currentQuantity} + ${detail.quantity} = ${newQuantity}`);
                
                await tx
                  .update(inventory)
                  .set({ 
                    quantity: newQuantity,
                    updatedAt: new Date()
                  })
                  .where(
                    and(
                      eq(inventory.productId, detail.productId),
                      eq(inventory.warehouseId, purchase.warehouseId)
                    )
                  );
              } else {
                console.log(`Creating new inventory record for product ${detail.productId} with quantity ${detail.quantity}`);
                
                await tx
                  .insert(inventory)
                  .values({
                    productId: detail.productId,
                    warehouseId: purchase.warehouseId,
                    quantity: detail.quantity
                  });
              }
            } catch (error) {
              console.error(`Error updating inventory for product ${detail.productId}:`, error);
              throw new Error(`Failed to update inventory for product ${detail.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
        
        // Create financial transaction for purchase if it's posted and has accountId
        if (purchase.status === 'posted' && purchase.accountId) {
          try {
            console.log(`Creating financial transaction for purchase ${newPurchase.id}`);
            
            await tx.insert(transactions).values({
              accountId: purchase.accountId,
              amount: total,
              type: 'credit' as 'credit' | 'debit' | 'journal', // We owe supplier money
              reference: purchase.purchaseNumber,
              date: purchase.date || new Date(),
              documentId: newPurchase.id,
              documentType: 'purchase',
              userId: purchase.userId,
              notes: `Purchase #${purchase.purchaseNumber}`
            });
            
            // Update account balance
            const [account] = await tx
              .select()
              .from(accounts)
              .where(eq(accounts.id, purchase.accountId));
            
            if (account) {
              const currentBalance = account.currentBalance || 0;
              const newBalance = currentBalance - total; // Credit: negative means we owe them
              
              console.log(`Updating account ${purchase.accountId} balance: ${currentBalance} - ${total} = ${newBalance}`);
              
              await tx
                .update(accounts)
                .set({ 
                  currentBalance: newBalance,
                  updatedAt: new Date()
                })
                .where(eq(accounts.id, purchase.accountId));
            } else {
              throw new Error(`Account with ID ${purchase.accountId} not found`);
            }
          } catch (error) {
            console.error(`Error creating financial transaction for purchase ${newPurchase.id}:`, error);
            throw new Error(`Failed to create financial transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        console.log(`Purchase processing completed successfully for ID: ${newPurchase.id}`);
        return newPurchase;
      } catch (error) {
        console.error("Error in createPurchase transaction:", error);
        throw error; // Rethrow the error to trigger transaction rollback
      }
    });
  }

  async getPurchase(id: number): Promise<{purchase: Purchase, details: PurchaseDetail[]} | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!purchase) {
      return undefined;
    }
    
    const details = await db
      .select()
      .from(purchaseDetails)
      .where(eq(purchaseDetails.purchaseId, id));
    
    return { purchase, details };
  }

  async listPurchases(accountId?: number, startDate?: Date, endDate?: Date): Promise<Purchase[]> {
    let query = db.select().from(purchases);
    
    const conditions: SQL[] = [];
    
    if (accountId) {
      conditions.push(eq(purchases.accountId, accountId));
    }
    
    if (startDate) {
      conditions.push(gte(purchases.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(purchases.date, endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(purchases.date));
  }

  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> {
    const [updatedPurchase] = await db
      .update(purchases)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(purchases.id, id))
      .returning();
    
    return updatedPurchase;
  }

  async deletePurchase(id: number): Promise<boolean> {
    return await db.transaction(async (tx: any) => {
      try {
        // Get purchase to update account balance
        const [purchase] = await tx
          .select()
          .from(purchases)
          .where(eq(purchases.id, id));
        
        if (purchase && purchase.status === 'posted') {
          // Delete related inventory transactions
          await tx
            .delete(inventoryTransactions)
            .where(
              and(
                eq(inventoryTransactions.documentId, id),
                eq(inventoryTransactions.documentType, 'purchase')
              )
            );
          
          // Restore inventory
          const details = await tx
            .select()
            .from(purchaseDetails)
            .where(eq(purchaseDetails.purchaseId, id));
          
          for (const detail of details) {
            const [invRecord] = await tx
              .select()
              .from(inventory)
              .where(
                and(
                  eq(inventory.productId, detail.productId),
                  eq(inventory.warehouseId, purchase.warehouseId)
                )
              );
            
            if (invRecord) {
              await tx
                .update(inventory)
                .set({ 
                  quantity: invRecord.quantity - detail.quantity,
                  updatedAt: new Date()
                })
                .where(eq(inventory.id, invRecord.id));
            }
          }
          
          // Delete financial transaction
          const [transaction] = await tx
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.documentId, id),
                eq(transactions.documentType, 'purchase')
              )
            );
          
          if (transaction) {
            await tx.delete(transactions).where(eq(transactions.id, transaction.id));
            
            // Update account balance
            if (purchase.accountId) {
              const [account] = await tx
                .select()
                .from(accounts)
                .where(eq(accounts.id, purchase.accountId));
              
              if (account) {
                await tx
                  .update(accounts)
                  .set({ 
                    currentBalance: account.currentBalance + purchase.total,
                    updatedAt: new Date()
                  })
                  .where(eq(accounts.id, purchase.accountId));
              }
            }
          }
        }
        
        // Delete purchase details
        await tx
          .delete(purchaseDetails)
          .where(eq(purchaseDetails.purchaseId, id));
        
        // Delete purchase
        await tx
          .delete(purchases)
          .where(eq(purchases.id, id));
        
        return true;
      } catch (error) {
        console.error('Error deleting purchase:', error);
        return false;
      }
    });
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const allSettings = await db.select().from(settings);
    return allSettings[0];
  }

  async updateSettings(updatedSettings: Partial<InsertSettings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    
    if (currentSettings) {
      const [updated] = await db
        .update(settings)
        .set({ 
          ...updatedSettings,
          updatedAt: new Date()
        })
        .where(eq(settings.id, currentSettings.id))
        .returning();
      return updated;
    } else {
      const [newSettings] = await db
        .insert(settings)
        .values({
          companyName: updatedSettings.companyName || 'شركة الريادي لتوزيع المواد الغذائية',
          ...updatedSettings
        })
        .returning();
      return newSettings;
    }
  }

  // Add count methods
  async countProducts(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(products);
      return result[0].count;
    } catch (error) {
      console.error("Error counting products:", error);
      return 0;
    }
  }

  async countCategories(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(categories);
      return result[0].count;
    } catch (error) {
      console.error("Error counting categories:", error);
      return 0;
    }
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>, details?: any[]): Promise<Invoice | undefined> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // First update the invoice
        const [updatedInvoice] = await tx
          .update(invoices)
          .set({
            ...invoice,
            updatedAt: new Date()
          })
          .where(eq(invoices.id, id))
          .returning();

        if (!updatedInvoice) {
          return undefined;
        }

        // If details are provided, update them
        if (details && Array.isArray(details)) {
          // Delete existing details
          await tx
            .delete(invoiceDetails)
            .where(eq(invoiceDetails.invoiceId, id));

          // Insert new details
          for (const detail of details) {
            await tx
              .insert(invoiceDetails)
              .values({
                ...detail,
                invoiceId: id
              });
          }
        }

        return updatedInvoice;
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  }
}

// Create a missing helper function
function or(...conditions: SQL[]): SQL {
  return sql`(${conditions.join(' OR ')})`;
}

export const storage = new DatabaseStorage();
