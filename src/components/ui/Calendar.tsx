import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "./Button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    onClear?: () => void;
    onToday?: () => void;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onClear,
  onToday,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white text-black rounded-md", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold",
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 hover:bg-zinc-100 border-zinc-300 text-black"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-black rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-zinc-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-black hover:bg-zinc-100"
        ),
        day_selected: "bg-primary text-black hover:bg-primary/90 focus:bg-primary focus:text-black",
        day_today: "bg-zinc-200 text-black font-bold",
        day_outside: "text-black opacity-30",
        day_disabled: "text-black opacity-30",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        footer: "border-t border-zinc-200 pt-2 mt-3",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        Dropdown: (dropdownProps: DropdownProps) => {
            const { fromYear, toYear, fromDate, toDate, currentMonth } = dropdownProps;

            const options: { label: string; value: string }[] = [];
            if (dropdownProps.name === "months") {
                const months = Array.from({ length: 12 }, (_, i) => new Date(new Date().getFullYear(), i));
                options.push(...months.map((month, i) => ({
                    value: i.toString(),
                    label: format(month, "MMMM", { locale: ptBR }),
                })));
            } else if (dropdownProps.name === "years") {
                const start = fromYear || fromDate?.getFullYear() || new Date().getFullYear() - 10;
                const end = toYear || toDate?.getFullYear() || new Date().getFullYear() + 10;
                const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                options.push(...years.map(year => ({
                    value: year.toString(),
                    label: year.toString(),
                })));
            }
            
            const selectedValue = dropdownProps.value?.toString();

            const handleChange = (newValue: string) => {
                const newDate = new Date(currentMonth || new Date());
                if (dropdownProps.name === "months") {
                    newDate.setMonth(parseInt(newValue));
                } else if (dropdownProps.name === "years") {
                    newDate.setFullYear(parseInt(newValue));
                }
                dropdownProps.onChange?.(newDate);
            };

            return (
                <Select
                    value={selectedValue}
                    onValueChange={handleChange}
                >
                    <SelectTrigger className="pr-1.5 focus:ring-0 h-8 text-sm capitalize border-zinc-300">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="capitalize">
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        },
      }}
      footer={
        (onClear || onToday) && (
            <div className="flex justify-between items-center pt-2 mt-2 px-1">
                <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto text-sm text-primary" 
                    onClick={onClear}
                >
                    Limpar
                </Button>
                <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto text-sm text-primary" 
                    onClick={onToday}
                >
                    Hoje
                </Button>
            </div>
        )
      }
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
