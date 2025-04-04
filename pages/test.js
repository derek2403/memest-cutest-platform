import React, { useState } from "react";
import Image from "next/image";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Chip,
  useDisclosure
} from "@heroui/react";

// Import service images
import metamask from "../styles/servicesImage/metamask.png";
import googlesheets from "../styles/servicesImage/googlesheets.png";
import gmail from "../styles/servicesImage/gmail.png";
import polygon from "../styles/servicesImage/polygon.png";
import oneinch from "../styles/servicesImage/1inch.png";

const serviceImages = [
  { name: "MetaMask", image: metamask },
  { name: "Google Sheets", image: googlesheets },
  { name: "Gmail", image: gmail },
  { name: "Polygon", image: polygon },
  { name: "1inch", image: oneinch },
];

export default function TestPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedService, setSelectedService] = useState(null);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Modal Test Page</h1>
      
      <Button onPress={onOpen} color="primary">
        Open Services Modal
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedService(null);
          }
          onOpenChange(open);
        }}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-w-[600px] max-h-[600px]",
          header: "border-b border-gray-200 dark:border-gray-700 py-2",
          body: "py-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Available Services</h2>
                </div>
                <p className="text-xs text-gray-500">Click or Drag services to the Workflow Below</p>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-3">
                  {/* Services Section */}
                  <div className="grid grid-cols-5 gap-3 justify-items-center">
                    {serviceImages.map((service, index) => (
                      <div 
                        key={index} 
                        className={`flex flex-col items-center min-w-[70px] cursor-pointer hover:scale-105 transition-transform ${selectedService?.name === service.name ? 'scale-105' : ''}`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className={`relative w-[60px] h-[60px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-1 p-1.5 border ${selectedService?.name === service.name ? 'border-primary-500' : 'border-transparent'}`}>
                          <Image
                            src={service.image}
                            alt={service.name}
                            fill
                            style={{ objectFit: "contain" }}
                            priority
                          />
                        </div>
                        <span className={`text-xs font-medium ${selectedService?.name === service.name ? 'text-primary-500' : ''}`}>{service.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Drop zone area - large vertical space with dashed border */}
                  <div className="mt-4 h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                    </div>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
