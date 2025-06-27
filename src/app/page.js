import { redirect } from "next/navigation";

export default function LoadingPage() {
  redirect("/signin");
}
