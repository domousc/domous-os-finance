import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Invoices() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard/invoices/receivable", { replace: true });
  }, [navigate]);

  return null;
}
