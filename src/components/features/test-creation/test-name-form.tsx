"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TestNameFormProps {
  onSubmit: (name: string) => void;
}

export function TestNameForm({ onSubmit }: TestNameFormProps) {
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name);
    setIsSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-2">
        <Label htmlFor="name">What is the name of the test?</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
