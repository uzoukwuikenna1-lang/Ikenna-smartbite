/**
 * Presenters: turn Mongoose documents into the exact JSON shapes the mobile app
 * already expects (see the app's src/data/mock.ts types). Keeps `id` as a string.
 */

type AnyDoc = Record<string, any>;

export function presentVendor(v: AnyDoc) {
  return {
    id: String(v._id),
    name: v.name,
    tagline: v.tagline,
    emoji: v.emoji,
    color: v.color,
    image: v.image ?? '',
    rating: v.rating,
    reviewCount: v.reviewCount,
    deliveryMins: v.deliveryMins,
    deliveryFee: v.deliveryFee,
    minOrder: v.minOrder,
    categories: v.categories,
    isOpen: v.isOpen,
    verification: v.verification,
  };
}

export function presentMenuItem(m: AnyDoc) {
  return {
    id: String(m._id),
    vendorId: String(m.vendorId),
    name: m.name,
    description: m.description,
    price: m.price,
    emoji: m.emoji,
    image: m.image ?? '',
    category: m.category,
    popular: m.popular,
    available: m.available,
  };
}

export function presentOrder(o: AnyDoc, currentUserId?: string) {
  // riderId may be a raw ObjectId or, when the route populates it, the rider's
  // User document. Only expose rider details once they've actually accepted.
  const riderDoc = o.riderId && typeof o.riderId === 'object' && o.riderId.name ? o.riderId : null;
  const rider =
    o.riderAccepted && riderDoc
      ? {
          name: riderDoc.name,
          phone: riderDoc.phone ?? '',
          vehicle: riderDoc.rider?.vehicle ?? '',
          plate: riderDoc.rider?.plate ?? '',
          verified: !!riderDoc.rider?.verified,
          idType: riderDoc.rider?.idType ?? '',
          idLast4: riderDoc.rider?.idLast4 ?? '',
          rating: riderDoc.rider?.rating ?? 5,
          trips: riderDoc.rider?.trips ?? 0,
        }
      : null;
  // Only the customer who placed the order may see the handover PIN — never the
  // rider (otherwise they could confirm delivery without actually handing over).
  const isOwner = currentUserId ? String(o.customerId) === currentUserId : false;
  return {
    id: String(o._id),
    vendorId: String(o.vendorId),
    vendorName: o.vendorName,
    customerName: o.customerName,
    items: (o.items ?? []).map((it: AnyDoc) => ({
      itemId: it.itemId,
      name: it.name,
      emoji: it.emoji,
      image: it.image ?? '',
      price: it.price,
      qty: it.qty,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    status: o.status,
    address: o.address,
    note: o.note,
    paymentMethod: o.paymentMethod,
    rated: o.rated,
    riderAccepted: o.riderAccepted,
    rider,
    deliveryPin: isOwner ? (o.deliveryPin ?? '') : undefined,
    createdAt: (o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt)).toISOString(),
    mine: currentUserId ? String(o.customerId) === currentUserId : undefined,
  };
}

export function presentUser(u: AnyDoc) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    status: u.status,
    vendorId: u.vendorId ? String(u.vendorId) : null,
    addresses: (u.addresses ?? []).map((a: AnyDoc) => ({
      id: String(a._id),
      label: a.label,
      details: a.details,
      isDefault: a.isDefault,
    })),
    cards: (u.cards ?? []).map((c: AnyDoc) => ({
      id: String(c._id),
      brand: c.brand,
      last4: c.last4,
      expiry: c.expiry,
    })),
    favourites: u.favourites ?? [],
    notifPrefs: u.notifPrefs,
    rider:
      u.role === 'rider'
        ? {
            vehicle: u.rider?.vehicle ?? '',
            plate: u.rider?.plate ?? '',
            verified: !!u.rider?.verified,
            idType: u.rider?.idType ?? '',
            idLast4: u.rider?.idLast4 ?? '',
            rating: u.rider?.rating ?? 5,
            trips: u.rider?.trips ?? 0,
          }
        : undefined,
  };
}

export function presentReview(r: AnyDoc) {
  return {
    id: String(r._id),
    vendorId: String(r.vendorId),
    customerName: r.customerName,
    rating: r.rating,
    text: r.text,
    createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
  };
}

export function presentAdminUser(u: AnyDoc) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    joinedAt: (u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt)).toISOString().slice(0, 10),
  };
}
