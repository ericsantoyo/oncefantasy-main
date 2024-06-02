// import NewMarketDown from "@/app/components/market/NewMarketDown";
// import NewMarketUp from "@/app/components/market/NewMarketUp";
// import GamesPreview from "./components/GamesPreview";
import GamesPreview from "@/components/GamesPreview";
import NewMarketDown from "@/components/market/NewMarketDown";
import NewMarketUp from "@/components/market/NewMarketUp";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-full  ">
        <GamesPreview />
      </div>
      <Separator className="col-span-full " />
      <NewMarketUp />
      <NewMarketDown />
    </main>
  );
}
