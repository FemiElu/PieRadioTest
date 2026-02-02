"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Event, TicketTier } from "@/lib/dummy-data/events";
import { Check, CreditCard, Calendar, Share2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface PurchaseModalProps {
    event: Event;
    isOpen: boolean;
    onClose: () => void;
}

type Step = "select" | "payment" | "success";

export function PurchaseModal({ event, isOpen, onClose }: PurchaseModalProps) {
    const [step, setStep] = useState<Step>("select");
    const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const reset = () => {
        setStep("select");
        setSelectedTier(null);
        setQuantity(1);
        setIsProcessing(false);
    };

    const handleClose = () => {
        onClose();
        setTimeout(reset, 300);
    };

    const handleProceed = () => {
        if (step === "select" && selectedTier) {
            setStep("payment");
        } else if (step === "payment") {
            setIsProcessing(true);
            // Simulate API call
            setTimeout(() => {
                setIsProcessing(false);
                setStep("success");
            }, 1500);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === "success" ? "You're Going!" : `Get Tickets: ${event.title}`}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "select" && "Choose your ticket type and quantity."}
                        {step === "payment" && "Enter your payment details (Mock)."}
                        {step === "success" && "Your tickets have been sent to your email."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === "select" && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {event.ticketTiers.map((tier) => (
                                    <div
                                        key={tier.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTier?.id === tier.id
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border hover:border-primary/50"
                                            } ${tier.available === 0 ? "opacity-50 pointer-events-none" : ""}`}
                                        onClick={() => tier.available > 0 && setSelectedTier(tier)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{tier.name}</span>
                                            <span className="font-bold">
                                                {tier.currency}{tier.price}
                                            </span>
                                        </div>
                                        {tier.description && (
                                            <p className="text-xs text-muted-foreground">{tier.description}</p>
                                        )}
                                        {tier.available === 0 && (
                                            <span className="text-xs font-medium text-destructive mt-1 block">Sold Out</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {selectedTier && (
                                <div className="flex items-center justify-between pt-2 border-t mt-4">
                                    <span className="text-sm font-medium">Quantity</span>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                        >
                                            -
                                        </Button>
                                        <span className="w-4 text-center">{quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setQuantity(Math.min(10, quantity + 1))} // Cap at 10 for demo
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === "payment" && selectedTier && (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{selectedTier.name} x {quantity}</span>
                                    <span>{selectedTier.currency}{selectedTier.price * quantity}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Service Fee</span>
                                    <span>{selectedTier.currency}{(3.50 * quantity).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-2 border-t border-border/20">
                                    <span>Total</span>
                                    <span>
                                        {selectedTier.currency}
                                        {(selectedTier.price * quantity + 3.50 * quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="justify-start gap-2">
                                        <CreditCard className="w-4 h-4" /> Card
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" disabled>
                                        Apple Pay
                                    </Button>
                                </div>
                                <div className="p-3 border rounded border-dashed text-center text-xs text-muted-foreground bg-muted/20">
                                    Mock Payment Flow - No charge will be made
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center space-y-4 py-2">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <Check className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{event.title}</h3>
                                <p className="text-muted-foreground">{format(new Date(event.date), "EEEE, MMMM do, yyyy")} at {event.time}</p>
                                <p className="text-sm text-muted-foreground mt-1">{event.venue.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="outline" className="w-full gap-2">
                                    <Calendar className="w-4 h-4" /> Add to Calendar
                                </Button>
                                <Button variant="outline" className="w-full gap-2">
                                    <Share2 className="w-4 h-4" /> Share
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === "select" && (
                        <Button onClick={handleProceed} disabled={!selectedTier} className="w-full">
                            Proceed to Checkout
                        </Button>
                    )}
                    {step === "payment" && (
                        <Button onClick={handleProceed} disabled={isProcessing} className="w-full">
                            {isProcessing ? "Processing..." : "Confirm Purchase"}
                        </Button>
                    )}
                    {step === "success" && (
                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
