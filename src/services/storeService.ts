import {
  collection,
  doc,
  onSnapshot,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Book, Order, Customer, OrderStatus, PosTransactionPayload, OrderItem } from '../types';
import { INITIAL_BOOKS } from '../data/seedBooks';

const BOOKS_COLLECTION = 'books';
const ORDERS_COLLECTION = 'orders';
const CUSTOMERS_COLLECTION = 'customers';

/**
 * Real-time listener for Books collection
 */
export function subscribeBooks(callback: (books: Book[]) => void): () => void {
  const booksRef = collection(db, BOOKS_COLLECTION);
  return onSnapshot(
    booksRef,
    (snapshot) => {
      const books: Book[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Book, 'id'>),
      }));
      // Sort by category then title
      books.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
      callback(books);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, BOOKS_COLLECTION);
    }
  );
}

/**
 * Seed or sync authentic covers for books
 */
export async function seedBooksIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, BOOKS_COLLECTION));
    const hasNewCategories = snap.docs.some((d) => d.data().category === 'Komik Jepang');
    const hasCostPrice = snap.docs.some((d) => d.data().costPrice !== undefined);
    const hasOutdatedCovers = snap.docs.some((d) => {
      const img = d.data().coverImage || '';
      return img.includes('unsplash.com');
    });

    if (snap.empty || !hasNewCategories || !hasCostPrice) {
      console.log('Seeding updated PustakaVia books catalogue with real book covers & pricing...');
      if (!snap.empty) {
        const deleteBatch = writeBatch(db);
        snap.docs.forEach((d) => deleteBatch.delete(d.ref));
        await deleteBatch.commit();
      }
      const batch = writeBatch(db);
      for (const book of INITIAL_BOOKS) {
        const docRef = doc(collection(db, BOOKS_COLLECTION));
        batch.set(docRef, {
          ...book,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      return true;
    } else if (hasOutdatedCovers) {
      console.log('Synchronizing real book covers for existing database records...');
      const updateBatch = writeBatch(db);
      let updatedCount = 0;
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const matchingInitial = INITIAL_BOOKS.find(
          (b) => b.title.trim().toLowerCase() === data.title?.trim().toLowerCase()
        );
        if (matchingInitial && matchingInitial.coverImage !== data.coverImage) {
          updateBatch.update(docSnap.ref, {
            coverImage: matchingInitial.coverImage,
            updatedAt: new Date().toISOString(),
          });
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        await updateBatch.commit();
        console.log(`Updated ${updatedCount} book covers with authentic real book cover art.`);
      }
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, BOOKS_COLLECTION);
  }
}

/**
 * Reset / Re-seed books database
 */
export async function resetBooksToDefault(): Promise<void> {
  try {
    // 1. Delete current books
    const snap = await getDocs(collection(db, BOOKS_COLLECTION));
    const deleteBatch = writeBatch(db);
    snap.docs.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

    // 2. Insert fresh initial books
    const addBatch = writeBatch(db);
    for (const book of INITIAL_BOOKS) {
      const docRef = doc(collection(db, BOOKS_COLLECTION));
      addBatch.set(docRef, {
        ...book,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await addBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, BOOKS_COLLECTION);
  }
}

/**
 * Add a new Book (Admin)
 */
export async function addBook(bookData: Omit<Book, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKS_COLLECTION), {
      ...bookData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, BOOKS_COLLECTION);
  }
}

/**
 * Update an existing Book (Admin)
 */
export async function updateBook(id: string, updates: Partial<Book>): Promise<void> {
  const path = `${BOOKS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, BOOKS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a Book (Admin)
 */
export async function deleteBook(id: string): Promise<void> {
  const path = `${BOOKS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, BOOKS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time listener for Orders collection
 */
export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, 'id'>),
      }));
      callback(orders);
    },
    (error) => {
      // Fallback query if index is building or not present
      return onSnapshot(
        ordersRef,
        (snapshot) => {
          const orders: Order[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Order, 'id'>),
          }));
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(orders);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, ORDERS_COLLECTION);
        }
      );
    }
  );
}

/**
 * Place a new Order with real-time stock reduction and customer sync
 */
export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'createdAt' | 'status'> & { initialProofUrl?: string }
): Promise<string> {
  const now = new Date().toISOString();
  const initialStatus: OrderStatus = orderPayload.initialProofUrl
    ? 'menunggu_approval'
    : 'menunggu_pembayaran';

  try {
    // Perform transaction to check stock and decrement stock
    const newOrderId = await runTransaction(db, async (transaction) => {
      // ==========================================
      // PHASE 1: ALL READS FIRST (Strict Firestore rule)
      // ==========================================
      const bookSnapshots = [];
      for (const item of orderPayload.items) {
        const bookRef = doc(db, BOOKS_COLLECTION, item.bookId);
        const bookSnap = await transaction.get(bookRef);
        if (!bookSnap.exists()) {
          throw new Error(`Buku "${item.title}" tidak ditemukan di database.`);
        }
        const currentStock = (bookSnap.data() as Book).stock;
        if (currentStock < item.quantity) {
          throw new Error(
            `Stok buku "${item.title}" tidak mencukupi (Tersisa: ${currentStock}, Dipesan: ${item.quantity}).`
          );
        }
        bookSnapshots.push({
          ref: bookRef,
          currentStock,
          quantity: item.quantity,
        });
      }

      // Read customer document BEFORE any writes
      const customerDocId = orderPayload.customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerDocId);
      const customerSnap = await transaction.get(customerRef);

      // ==========================================
      // PHASE 2: ALL WRITES AFTER ALL READS
      // ==========================================
      // 1. Deduct stocks
      for (const b of bookSnapshots) {
        transaction.update(b.ref, {
          stock: b.currentStock - b.quantity,
          updatedAt: now,
        });
      }

      // 2. Create order document
      const orderRef = doc(collection(db, ORDERS_COLLECTION));
      const orderData: Omit<Order, 'id'> = {
        orderNumber: orderPayload.orderNumber,
        customerName: orderPayload.customerName,
        customerEmail: orderPayload.customerEmail,
        customerPhone: orderPayload.customerPhone,
        shippingAddress: orderPayload.shippingAddress,
        items: orderPayload.items,
        subtotal: orderPayload.subtotal,
        shippingCost: orderPayload.shippingCost,
        totalAmount: orderPayload.totalAmount,
        status: initialStatus,
        paymentMethod: orderPayload.paymentMethod,
        paymentProofUrl: orderPayload.initialProofUrl || '',
        paymentProofUploadedAt: orderPayload.initialProofUrl ? now : '',
        notes: orderPayload.notes || '',
        trackingNumber: '',
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(orderRef, orderData);

      // 3. Upsert Customer Record
      if (customerSnap.exists()) {
        const curCust = customerSnap.data() as Customer;
        transaction.update(customerRef, {
          name: orderPayload.customerName,
          phone: orderPayload.customerPhone,
          totalOrders: (curCust.totalOrders || 0) + 1,
          totalSpent: (curCust.totalSpent || 0) + orderPayload.totalAmount,
          lastOrderDate: now,
        });
      } else {
        transaction.set(customerRef, {
          id: customerDocId,
          name: orderPayload.customerName,
          email: orderPayload.customerEmail,
          phone: orderPayload.customerPhone,
          totalOrders: 1,
          totalSpent: orderPayload.totalAmount,
          lastOrderDate: now,
          createdAt: now,
        });
      }

      return orderRef.id;
    });

    return newOrderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ORDERS_COLLECTION);
  }
}

/**
 * Upload Payment Proof from Customer
 */
export async function uploadPaymentProof(orderId: string, proofUrl: string): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  const now = new Date().toISOString();
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      paymentProofUrl: proofUrl,
      paymentProofUploadedAt: now,
      status: 'menunggu_approval',
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Approve Customer's Payment Proof (Admin)
 */
export async function approvePaymentProof(orderId: string): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  const now = new Date().toISOString();
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status: 'diproses',
      paymentRejectionReason: '',
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Reject Customer's Payment Proof (Admin)
 */
export async function rejectPaymentProof(orderId: string, reason: string): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  const now = new Date().toISOString();
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status: 'menunggu_pembayaran',
      paymentRejectionReason: reason || 'Bukti transfer tidak valid atau nominal tidak sesuai.',
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Update Order Status (Admin)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  trackingNumber?: string
): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  const now = new Date().toISOString();
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: now,
    };
    if (trackingNumber !== undefined) {
      updates.trackingNumber = trackingNumber;
    }
    await updateDoc(orderRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Real-time listener for Customers collection
 */
export function subscribeCustomers(callback: (customers: Customer[]) => void): () => void {
  const customersRef = collection(db, CUSTOMERS_COLLECTION);
  return onSnapshot(
    customersRef,
    (snapshot) => {
      const customers: Customer[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Customer, 'id'>),
      }));
      customers.sort((a, b) => b.totalSpent - a.totalSpent);
      callback(customers);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, CUSTOMERS_COLLECTION);
    }
  );
}

/**
 * Create a POS In-Store Cashier Transaction (Instant Complete, Real-Time Stock Deduction)
 */
export async function createPosTransaction(payload: PosTransactionPayload): Promise<string> {
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `POS-${dateStr}-${randomSuffix}`;

  try {
    const newOrderId = await runTransaction(db, async (transaction) => {
      // ==========================================
      // PHASE 1: ALL READS FIRST (Strict Firestore rule)
      // ==========================================
      const bookSnapshots: {
        ref: any;
        currentStock: number;
        costPrice: number;
        price: number;
        title: string;
        author: string;
        coverImage: string;
        quantity: number;
      }[] = [];

      for (const item of payload.items) {
        const bookRef = doc(db, BOOKS_COLLECTION, item.book.id);
        const bookSnap = await transaction.get(bookRef);
        if (!bookSnap.exists()) {
          throw new Error(`Buku "${item.book.title}" tidak ditemukan di database.`);
        }
        const data = bookSnap.data() as Book;
        if (data.stock < item.quantity) {
          throw new Error(
            `Stok kasir untuk "${item.book.title}" tidak mencukupi (Tersisa: ${data.stock}, Diminta: ${item.quantity}).`
          );
        }
        bookSnapshots.push({
          ref: bookRef,
          currentStock: data.stock,
          costPrice: data.costPrice || Math.round(data.price * 0.7),
          price: data.price,
          title: data.title,
          author: data.author,
          coverImage: data.coverImage,
          quantity: item.quantity,
        });
      }

      // Read customer document if customer phone/name is specified
      const customerEmail = payload.customerPhone
        ? `walkin_${payload.customerPhone.replace(/[^0-9]/g, '')}@pustakavia.com`
        : 'walkin@pustakavia.com';
      const customerDocId = customerEmail.replace(/[^a-z0-9]/g, '_');
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerDocId);
      const customerSnap = await transaction.get(customerRef);

      // ==========================================
      // PHASE 2: ALL WRITES AFTER ALL READS
      // ==========================================
      // 1. Deduct stocks
      for (const b of bookSnapshots) {
        transaction.update(b.ref, {
          stock: b.currentStock - b.quantity,
          updatedAt: now,
        });
      }

      // 2. Calculate totals
      const subtotal = bookSnapshots.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const totalAmount = subtotal;

      const orderItems: OrderItem[] = bookSnapshots.map((it) => ({
        bookId: it.ref.id,
        title: it.title,
        author: it.author,
        price: it.price,
        costPrice: it.costPrice,
        quantity: it.quantity,
        coverImage: it.coverImage,
      }));

      // 3. Create POS Order Document
      const orderRef = doc(collection(db, ORDERS_COLLECTION));
      const orderData: Omit<Order, 'id'> = {
        orderNumber,
        customerName: payload.customerName || 'Pelanggan Kasir Toko',
        customerEmail,
        customerPhone: payload.customerPhone || '-',
        shippingAddress: 'Transaksi Kasir Toko Langsung (PoS Offline)',
        items: orderItems,
        subtotal,
        shippingCost: 0,
        totalAmount,
        status: 'selesai',
        paymentMethod: payload.paymentMethod,
        notes: payload.notes || 'Penjualan Kasir PoS',
        trackingNumber: 'POS-CASHIER',
        channel: 'pos',
        cashPaid: payload.cashPaid,
        changeDue: payload.changeDue,
        cashierName: payload.cashierName || 'Kasir PustakaVia',
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(orderRef, orderData);

      // 4. Upsert Customer
      if (customerSnap.exists()) {
        const curCust = customerSnap.data() as Customer;
        transaction.update(customerRef, {
          name: payload.customerName || curCust.name,
          phone: payload.customerPhone || curCust.phone,
          totalOrders: (curCust.totalOrders || 0) + 1,
          totalSpent: (curCust.totalSpent || 0) + totalAmount,
          lastOrderDate: now,
        });
      } else {
        transaction.set(customerRef, {
          id: customerDocId,
          name: payload.customerName || 'Pelanggan Kasir Toko',
          email: customerEmail,
          phone: payload.customerPhone || '-',
          totalOrders: 1,
          totalSpent: totalAmount,
          lastOrderDate: now,
          createdAt: now,
        });
      }

      return orderRef.id;
    });

    return newOrderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ORDERS_COLLECTION);
  }
}

/**
 * Update Book Pricing & Profit Ratio
 */
export async function updateBookPricing(
  bookId: string,
  costPrice: number,
  price: number,
  profitRatio: number
): Promise<void> {
  const path = `${BOOKS_COLLECTION}/${bookId}`;
  try {
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    await updateDoc(bookRef, {
      costPrice,
      price,
      profitRatio,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Bulk Update Profit Ratio across Books
 */
export async function bulkUpdateProfitRatio(
  ratioPercentage: number,
  categoryFilter?: string
): Promise<number> {
  try {
    const snap = await getDocs(collection(db, BOOKS_COLLECTION));
    const batch = writeBatch(db);
    let count = 0;
    const now = new Date().toISOString();

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as Book;
      if (!categoryFilter || categoryFilter === 'Semua Kategori' || data.category === categoryFilter) {
        const baseCost = data.costPrice || Math.round(data.price / (1 + (data.profitRatio || 30) / 100));
        // Calculate new selling price rounded to nearest 500 IDR
        const rawPrice = baseCost * (1 + ratioPercentage / 100);
        const roundedPrice = Math.round(rawPrice / 500) * 500;

        batch.update(docSnap.ref, {
          costPrice: baseCost,
          price: roundedPrice,
          profitRatio: ratioPercentage,
          updatedAt: now,
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, BOOKS_COLLECTION);
  }
}

