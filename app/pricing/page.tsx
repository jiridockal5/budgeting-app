import { redirect } from "next/navigation";

/** Public pricing lives in the FAQ while the product is free. */
export default function PricingPage() {
  redirect("/#faq");
}
