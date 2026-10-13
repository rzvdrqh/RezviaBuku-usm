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
import { Book, Order, Customer, OrderStatus } from '../types';
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
 * Seed 12 initial books if database is empty
 */
export async function seedBooksIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, BOOKS_COLLECTION));
    const hasNewCategories = snap.docs.some((d) => d.data().category === 'Komik Jepang');
    if (snap.empty || !hasNewCategories) {
      console.log('Seeding updated PustakaVia books catalogue...');
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
      // 1. Verify stocks
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
        transaction.update(bookRef, {
          stock: currentStock - item.quantity,
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
      const customerDocId = orderPayload.customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerDocId);
      const customerSnap = await transaction.get(customerRef);

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
