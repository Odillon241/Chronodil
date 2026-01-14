"use client";

import { cn } from "@/lib/utils";
import { motion, Variants } from "motion/react";

interface WordPullUpProps {
    text: string;
    className?: string;
    wrapperClassName?: string;
    variants?: Variants;
    delayMultiple?: number;
}

export default function WordPullUp({
    text,
    className,
    wrapperClassName,
    variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
    },
    delayMultiple = 0.2,
}: WordPullUpProps) {
    const words = text.split(" ");

    return (
        <div className={cn("flex flex-wrap justify-center gap-2", wrapperClassName)}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    variants={variants}
                    initial="hidden"
                    animate="show"
                    custom={i}
                    className={cn("inline-block", className)}
                    style={{ transitionDelay: `${i * delayMultiple}s` }}
                >
                    {word === "" ? "\u00A0" : word}
                </motion.span>
            ))}
        </div>
    );
}
