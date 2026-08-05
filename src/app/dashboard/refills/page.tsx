"use client";

import * as React from "react";
import { ClipboardList, Search } from "lucide-react";
import { useProductRequests } from "@/hooks/queries/use-product-requests";
import { useAuthStore } from "@/store/auth-store";
import { CreateRefillDialog } from "@/features/refills/create-refill-dialog";
import { RefillsTable } from "@/features/refills/refills-table";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

export default function RefillsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Fetch only general refills (refill/restock requests)
  const { data, isLoading } = useProductRequests({
    type: "GENERAL",
    pageNo: page,
    showPerPage: PAGE_SIZE,
  });

  const allRequests = data?.requests ?? [];
  const filteredRequests = allRequests.filter(
    (req) =>
      !search ||
      req.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      (req.requestedBy?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Refill Requests</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Review and approve stock refill requests submitted by employees."
                : "Request stock refills and check the status of your requests."}
            </p>
          </div>
        </div>
        {!isAdmin && <CreateRefillDialog />}
      </div>

      {/* Main List */}
      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by product or requester..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <RefillsTable requests={filteredRequests} />
        )}

        <Pagination
          page={page}
          pageCount={data?.totalPages ?? 1}
          onPageChange={setPage}
          totalItems={data?.totalData ?? 0}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
