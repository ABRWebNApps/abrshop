import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Package, CheckCircle, Clock, XCircle, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

async function getOrder(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, items:order_items(*, product:products(*, category:categories(*), brand:brands(*)))"
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "processing":
    case "delivered":
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    case "pending":
      return <Clock className="w-8 h-8 text-yellow-500" />;
    case "cancelled":
      return <XCircle className="w-8 h-8 text-red-500" />;
    default:
      return <Package className="w-8 h-8 text-blue-500" />;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "processing":
      return "Order Processing";
    case "delivered":
      return "Order Delivered";
    case "pending":
      return "Payment Pending";
    case "cancelled":
      return "Order Cancelled";
    default:
      return "Order Received";
  }
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<{ [key: string]: string | string[] | undefined }>
    | { [key: string]: string | string[] | undefined };
}) {
  // Handle both sync and async params (Next.js 15+ compatibility)
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams || {};
  const order = await getOrder(resolvedParams.id);

  if (!order) {
    notFound();
  }

  const items = (order.items as any[]) || [];
  const paymentStatus = resolvedSearchParams.payment as string | undefined;
  const statusParam = resolvedSearchParams.status as string | undefined;
  const isSuccessfulPayment = paymentStatus === "success";
  const isCancelledPayment = paymentStatus === "cancelled" || statusParam === "cancelled";

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success/Cancelled Message Banner */}
        {isSuccessfulPayment && (
          <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-semibold">
                Payment Successful!
              </p>
              <p className="text-green-300 text-sm">
                Your order has been confirmed and is being processed.
              </p>
            </div>
          </div>
        )}
        {isCancelledPayment && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold">Payment Cancelled</p>
              <p className="text-yellow-300 text-sm">
                Your order is pending. You can complete payment later from your
                profile.
              </p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl shadow-sm border border-white/10 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {getStatusText(order.status)}
                </h1>
                <p className="text-gray-400">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="text-blue-500 hover:text-blue-400 text-sm font-medium"
            >
              View All Orders →
            </Link>
          </div>

          {/* Receipt Information */}
          <div className="mb-8 bg-gray-800/50 rounded-lg p-6 border border-white/5">
            <div className="flex items-center space-x-2 mb-4">
              <Receipt className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">
                Order Receipt
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
                  Order Information
                </h3>
                <div className="text-gray-300 space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-400">Order ID:</span>{" "}
                    <span className="font-mono">{order.id}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-400">
                      Order Date:
                    </span>{" "}
                    {new Date(order.created_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <span className="font-medium text-gray-400">Status:</span>{" "}
                    <span
                      className={`capitalize font-semibold ${
                        order.status === "processing" ||
                        order.status === "delivered"
                          ? "text-green-400"
                          : order.status === "pending"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>
                  {order.payment_reference && (
                    <p>
                      <span className="font-medium text-gray-400">
                        Payment Reference:
                      </span>{" "}
                      <span className="font-mono">
                        {order.payment_reference}
                      </span>
                    </p>
                  )}
                  {order.paid_at && (
                    <p>
                      <span className="font-medium text-gray-400">
                        Paid At:
                      </span>{" "}
                      {new Date(order.paid_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
                  Customer Information
                </h3>
                <div className="text-gray-300 space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-400">Email:</span>{" "}
                    {order.email}
                  </p>
                  {order.user_id && (
                    <p>
                      <span className="font-medium text-gray-400">
                        Account:
                      </span>{" "}
                      <span className="text-green-400">Verified</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-8">
            <h2 className="font-semibold text-white mb-4 text-lg">
              Shipping Address
            </h2>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5">
              <div className="text-gray-300 space-y-1">
                <p className="font-medium text-white">
                  {order.shipping_address?.name || "N/A"}
                </p>
                <p>{order.shipping_address?.address || "N/A"}</p>
                <p>
                  {order.shipping_address?.city || ""},{" "}
                  {order.shipping_address?.state || ""}{" "}
                  {order.shipping_address?.zip || ""}
                </p>
                <p>{order.shipping_address?.country || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="font-semibold text-white mb-4 text-lg">
              Order Items
            </h2>
            <div className="space-y-4">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between py-4 border-b border-white/10 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">
                      {item.product?.name || "Product"}
                    </p>
                    {item.product?.category && (
                      <p className="text-xs text-gray-500 mb-1">
                        Category: {item.product.category.name}
                      </p>
                    )}
                    {item.product?.brand && (
                      <p className="text-xs text-gray-500 mb-1">
                        Brand: {item.product.brand.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-400">
                      Quantity: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-2xl font-bold text-white">Total</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/profile"
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-center font-medium"
            >
              View All Orders
            </Link>
            {order.status === "pending" && (
              <Link
                href={`/checkout?orderId=${order.id}`}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center font-medium"
              >
                Complete Order
              </Link>
            )}
            <PrintButton />
          </div>
        </div>
      </div>
    </div>
  );
}
