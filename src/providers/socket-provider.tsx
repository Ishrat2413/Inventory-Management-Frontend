"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to the backend
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
    const defaultSocketUrl = rawBaseUrl.replace(/\/api\/v1\/?$/, "");
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || defaultSocketUrl;
    const socketInstance = io(socketUrl);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("[Socket] Connected to server");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("[Socket] Disconnected from server");
    });

    // Listen to generic global database change events
    socketInstance.on("db:changed", (data: { model: string; operation: string }) => {
      console.log("[Socket] DB changed:", data);
      // Invalidate queries that might be affected by this model
      // React Query will automatically refetch active queries
      // We map the backend model names to our query keys
      const modelToQueryKey: Record<string, string[]> = {
        product: ["products", "low-stock-products"],
        stockmovement: ["stock-movements", "inventory-value"],
        task: ["tasks"],
        user: ["users"],
        productrequest: ["product-requests"],
        attendance: ["attendance"],
        vendor: ["vendors"],
      };

      const keysToInvalidate = modelToQueryKey[data.model] || [];
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      // Also invalidate dashboard general reports
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
