import { handle } from "@/lib/route";
import { providerInfo } from "@/lib/ai/provider";

export const GET = () => handle(async () => providerInfo());
