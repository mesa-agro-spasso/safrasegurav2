import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputSnapshot: unknown;
  resultSnapshot: unknown;
  title?: string;
}

export default function SnapshotViewer({ open, onOpenChange, inputSnapshot, resultSnapshot, title }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">{title ?? "Snapshots"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="input" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="input" className="text-xs">Input Snapshot</TabsTrigger>
            <TabsTrigger value="result" className="text-xs">Result Snapshot</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="flex-1 overflow-auto">
            <pre className="text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap break-all">
              {JSON.stringify(inputSnapshot, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="result" className="flex-1 overflow-auto">
            <pre className="text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap break-all">
              {JSON.stringify(resultSnapshot, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
