"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TestDescriptionFormProps {
  onSubmit: (description: string) => void;
}

export function TestDescriptionForm({ onSubmit }: TestDescriptionFormProps) {
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(description);
    setIsSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-2">
        <Label htmlFor="description">Provide a brief description for the test.</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the test purpose and content..."
          disabled={isSubmitted}
        />
      </div>
      {!isSubmitted && (
        <Button type="submit" className="w-max mt-4 rounded-full">
          Continue
        </Button>
      )}
    </form>
  );
}
