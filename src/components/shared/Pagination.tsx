import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const range = (start: number, end: number) => {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const getPages = () => {
        const delta = 1;
        const left = currentPage - delta;
        const right = currentPage + delta + 1;
        const pages: (number | string)[] = [];
        const points: number[] = [];

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= left && i < right)) {
                points.push(i);
            }
        }

        let l: number | undefined;
        for (const i of points) {
            if (l !== undefined) {
                if (i - l === 2) {
                    pages.push(l + 1);
                } else if (i - l !== 1) {
                    pages.push("...");
                }
            }
            pages.push(i);
            l = i;
        }

        return pages;
    };

    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-border bg-surface/50", className)}>
            <div className="flex flex-1 items-center justify-between gap-4 sm:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                    Next
                </Button>
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <p className="text-sm text-subtext">
                    Showing page <span className="font-semibold text-text">{currentPage}</span> of{" "}
                    <span className="font-semibold text-text">{totalPages}</span>
                </p>
                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPages().map((p, i) => (
                        p === "..." ? (
                            <span key={`dots-${i}`} className="px-2 text-subtext">...</span>
                        ) : (
                            <Button
                                key={p}
                                variant={currentPage === p ? "primary" : "ghost"}
                                size="sm"
                                className="h-8 w-8 text-sm"
                                onClick={() => onPageChange(p as number)}
                            >
                                {p}
                            </Button>
                        )
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </nav>
            </div>
        </div>
    );
}
