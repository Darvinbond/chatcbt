"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestData {
  id: string;
  title: string;
  attempts: {
    id: string;
    score: number | null;
    submittedAt: string | null;
    duration: number | null;
    tabSwitches: number;
    fullscreenExits: number;
    student: {
      name: string;
      code: string;
    };
  }[];
}

export function ExportScoresModal({ isOpen, onClose }: ExportScoresModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch("/api/export/scores");
      if (!response.ok) {
        throw new Error("Failed to fetch scores");
      }
      
      const jsonResponse = await response.json();
      const tests: TestData[] = jsonResponse.data;

      if (!tests || tests.length === 0) {
        toast.error("No tests found to export");
        return;
      }

      const wb = XLSX.utils.book_new();

      tests.forEach((test) => {
        // Prepare data for the sheet
        const sheetData = test.attempts.map((attempt) => ({
          "Student Name": attempt.student.name,
          "Student Code": attempt.student.code,
          "Score": attempt.score !== null ? `${attempt.score}%` : "N/A",
          "Submitted At": attempt.submittedAt ? format(new Date(attempt.submittedAt), "PPpp") : "Not Submitted",
          "Duration (min)": attempt.duration ? Math.round(attempt.duration / 60) : 0,
          "Tab Switches": attempt.tabSwitches,
          "Fullscreen Exits": attempt.fullscreenExits,
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(sheetData);

        // Adjust column widths
        const colWidths = [
          { wch: 20 }, // Student Name
          { wch: 15 }, // Student Code
          { wch: 10 }, // Score
          { wch: 25 }, // Submitted At
          { wch: 15 }, // Duration
          { wch: 15 }, // Tab Switches
          { wch: 15 }, // Fullscreen Exits
        ];
        ws['!cols'] = colWidths;

        // Sanitize sheet name (Excel limits: 31 chars, no []*/\?:)
        let sheetName = test.title.replace(/[\[\]\*\/\\\?\:]/g, "").substring(0, 31);
        
        // Ensure unique sheet names if duplicates exist after sanitization
        let counter = 1;
        const originalSheetName = sheetName;
        while (wb.SheetNames.includes(sheetName)) {
            sheetName = `${originalSheetName.substring(0, 28)}(${counter})`;
            counter++;
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Write file
      XLSX.writeFile(wb, `edutest_scores_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      
      toast.success("Scores exported successfully");
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export scores");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export All Scores</DialogTitle>
          <DialogDescription>
            Are you sure you want to export scores for all tests? This will generate an Excel file with a separate tab for each test containing student attempts.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Yes, Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
