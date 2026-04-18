"use client";
import Image from "next/image";
import { PlusIcon } from "mage-icons-react/stroke";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import him from "@/assets/campaign-template/himsingh.jpeg";
import alex from "@/assets/campaign-template/alex.jpeg";

const celebritiesCampaignTemplates = [
  {
    id: 1,
    name: "Him Singh",
    description:
      "A high-engagement template from a well-known Freelancer / Marketing Coach who is influencing thousands of people in India, to earn online with Freelancing.",
    details: ["Engaging content", "High open rate", "Targeted audience"],
    src: him,
    category: "Market Your Services",
    delay: 2,
    followUps: 5,
    time: "MORNING",
  },
  {
    id: 2,
    name: "Alex Hamrozi",
    description:
      "A high-converting template from a prominent American entrepreneur, investor, author, and content creator.",
    details: ["Engaging content", "High open rate", "Targeted audience"],
    src: alex,
    category: "Market Your Product",
    delay: 1,
    followUps: 3,
    time: "MORNING",
  },
];

export default function CampaignTemplateSelection({
  onSelectCustom,
  onSelectTemplate,
}) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-2">Create Campaign</h1>
      <p className="text-gray-600 mb-8">
        Choose a template or create from scratch
      </p>

      <div id="templates" className="w-full">
        <Carousel className="w-full mb-8 max-w-[90%] mx-auto">
          <CarouselContent className="flex flex-wrap ml-4">
            {/* "Create from Scratch" Item */}
            <CarouselItem className="basis-full sm:basis-1/3 lg:basis-1/4 p-2">
              <div
                id="tour-create-from-scratch"
                className="p-2 h-64 rounded-none flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 duration-300 cursor-pointer"
                onClick={onSelectCustom}
              >
                <div className="flex flex-col gap-2 items-center justify-center rounded-none p-4">
                  <PlusIcon className="w-11 h-11 text-gray-700" />
                  <p className="text-center text-gray-800 text-lg font-semibold">
                    Create
                    <br />
                    from Scratch
                  </p>
                </div>
              </div>
            </CarouselItem>

            {/* Celebrity Campaign Templates */}
            {celebritiesCampaignTemplates.map((item, index) => (
              <CarouselItem
                key={index}
                className="basis-full sm:basis-1/3 lg:basis-1/4 p-2"
              >
                <div
                  className="p-2 relative h-64 rounded-none border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] grid grid-rows-[auto,1fr,auto] gap-3 w-full transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 duration-300 cursor-pointer items-center justify-start"
                  onClick={
                    item.id !== 2 ? () => onSelectTemplate(item) : undefined
                  }
                >
                  {/* Coming Soon Overlay */}
                  {item.id === 2 && (
                    <div className="absolute inset-0 rounded-none bg-neutral-300/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <p className="font-sans text-black text-lg font-bold">
                        Coming Soon...
                      </p>
                    </div>
                  )}

                  {/* Heading */}
                  <h2 className="font-medium text-gray-700 text-sm text-center px-4">
                    {item.category}
                  </h2>

                  {/* Image */}
                  <div className="relative flex justify-center items-center">
                    <Image
                      src={item.src || "/placeholder.svg"}
                      alt={item.name}
                      className="h-32 w-32 object-cover rounded-full border-4 border-gray-200"
                    />
                  </div>

                  {/* Campaign Name */}
                  <p className="text-gray-800 text-md font-semibold text-center px-4">
                    {item.name} Inspired Campaign
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border border-black" />
          <CarouselNext className="border border-black" />
        </Carousel>
      </div>
    </div>
  );
}
