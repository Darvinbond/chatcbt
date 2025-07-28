"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TestDurationFormProps {
  onSubmit: (duration: number) => void;
}

export function TestDurationForm({ onSubmit }: TestDurationFormProps) {
  const [duration, setDuration] = useState(60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(duration);
    setIsSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-2">
        <Label htmlFor="duration">Set the test duration (in minutes).</Label>
        <Input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          required
          disabled={isSubmitted}
        />
      </div>
      {!isSubmitted && (
        <Button type="submit" className="w-max mt-4 rounded-full">
          Create Test
        </Button>
      )}
    </form>
  );
}
