"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useWalkthroughStore } from '@/store/walkthrough-store'
import { WALKTHROUGH_STEPS } from './walkthrough-steps'
import type { TooltipPlacement } from './walkthrough-steps'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

interface TargetRect {
    top: number
    left: number
    width: number
    height: number
    bottom: number
    right: number
}

function getTooltipPosition(
    targetRect: TargetRect,
    placement: TooltipPlacement,
    tooltipWidth: number,
    tooltipHeight: number
): { top: number; left: number; actualPlacement: TooltipPlacement } {
    const GAP = 16
    const VIEWPORT_PADDING = 16
    let top = 0
    let left = 0
    let actualPlacement = placement

    switch (placement) {
        case 'right':
            top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
            left = targetRect.right + GAP
            if (left + tooltipWidth > window.innerWidth - VIEWPORT_PADDING) {
                // Flip to left
                left = targetRect.left - tooltipWidth - GAP
                actualPlacement = 'left'
            }
            break
        case 'left':
            top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
            left = targetRect.left - tooltipWidth - GAP
            if (left < VIEWPORT_PADDING) {
                left = targetRect.right + GAP
                actualPlacement = 'right'
            }
            break
        case 'bottom':
            top = targetRect.bottom + GAP
            left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
            if (top + tooltipHeight > window.innerHeight - VIEWPORT_PADDING) {
                top = targetRect.top - tooltipHeight - GAP
                actualPlacement = 'top'
            }
            break
        case 'top':
            top = targetRect.top - tooltipHeight - GAP
            left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
            if (top < VIEWPORT_PADDING) {
                top = targetRect.bottom + GAP
                actualPlacement = 'bottom'
            }
            break
    }

    // Clamp position to viewport
    top = Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - tooltipHeight - VIEWPORT_PADDING))
    left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - tooltipWidth - VIEWPORT_PADDING))

    return { top, left, actualPlacement }
}

function getArrowStyles(placement: TooltipPlacement): React.CSSProperties {
    const size = 10
    const base: React.CSSProperties = {
        position: 'absolute',
        width: 0,
        height: 0,
    }

    switch (placement) {
        case 'right':
            return {
                ...base,
                left: -size,
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: `${size}px solid transparent`,
                borderBottom: `${size}px solid transparent`,
                borderRight: `${size}px solid white`,
            }
        case 'left':
            return {
                ...base,
                right: -size,
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: `${size}px solid transparent`,
                borderBottom: `${size}px solid transparent`,
                borderLeft: `${size}px solid white`,
            }
        case 'bottom':
            return {
                ...base,
                top: -size,
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: `${size}px solid transparent`,
                borderRight: `${size}px solid transparent`,
                borderBottom: `${size}px solid white`,
            }
        case 'top':
            return {
                ...base,
                bottom: -size,
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: `${size}px solid transparent`,
                borderRight: `${size}px solid transparent`,
                borderTop: `${size}px solid white`,
            }
    }
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
    const { isActive, currentStep, totalSteps, nextStep, prevStep, skipTour, startTour, hasSeenTour } =
        useWalkthroughStore()

    const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; actualPlacement: TooltipPlacement } | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const [mounted, setMounted] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<ResizeObserver | null>(null)

    // Mount check
    useEffect(() => {
        setMounted(true)
    }, [])

    // Auto-start tour for first-time users
    useEffect(() => {
        if (mounted && !hasSeenTour && !isActive) {
            const timer = setTimeout(() => {
                startTour(WALKTHROUGH_STEPS.length)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [mounted, hasSeenTour, isActive, startTour])

    // Find and track the target element
    const updateTargetRect = useCallback(() => {
        if (!isActive || currentStep >= WALKTHROUGH_STEPS.length) return

        const step = WALKTHROUGH_STEPS[currentStep]
        const target = document.querySelector(step.targetSelector)

        if (target) {
            const rect = target.getBoundingClientRect()
            const padding = 6
            setTargetRect({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
                bottom: rect.bottom + padding,
                right: rect.right + padding,
            })
        } else {
            setTargetRect(null)
        }
    }, [isActive, currentStep])

    useEffect(() => {
        if (!isActive) return

        setIsAnimating(true)
        const timer = setTimeout(() => setIsAnimating(false), 300)

        updateTargetRect()

        // Observe resize
        observerRef.current = new ResizeObserver(updateTargetRect)
        observerRef.current.observe(document.body)

        window.addEventListener('resize', updateTargetRect)
        window.addEventListener('scroll', updateTargetRect, true)

        return () => {
            clearTimeout(timer)
            observerRef.current?.disconnect()
            window.removeEventListener('resize', updateTargetRect)
            window.removeEventListener('scroll', updateTargetRect, true)
        }
    }, [isActive, currentStep, updateTargetRect])

    // Compute tooltip position after target rect is set
    useEffect(() => {
        if (!targetRect || !tooltipRef.current) return

        const step = WALKTHROUGH_STEPS[currentStep]
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const pos = getTooltipPosition(targetRect, step.placement, tooltipRect.width, tooltipRect.height)
        setTooltipPos(pos)
    }, [targetRect, currentStep])

    const step = isActive && currentStep < WALKTHROUGH_STEPS.length ? WALKTHROUGH_STEPS[currentStep] : null
    const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

    if (!mounted || !isActive || !step) {
        return <>{children}</>
    }

    const overlay = createPortal(
        <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'none' }}>
            {/* SVG Overlay with spotlight cutout */}
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'auto', transition: 'all 0.3s ease-in-out' }}
                onClick={skipTour}
            >
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left}
                                y={targetRect.top}
                                width={targetRect.width}
                                height={targetRect.height}
                                rx="12"
                                ry="12"
                                fill="black"
                                style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.65)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Spotlight glow ring */}
            {targetRect && (
                <div
                    className="absolute rounded-xl ring-2 ring-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className={cn(
                    "absolute z-[9999] w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700",
                    "transform transition-all duration-300 ease-out",
                    isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                )}
                style={{
                    top: tooltipPos?.top ?? -9999,
                    left: tooltipPos?.left ?? -9999,
                    pointerEvents: 'auto',
                }}
            >
                {/* Arrow */}
                {tooltipPos && <div style={getArrowStyles(tooltipPos.actualPlacement)} />}

                {/* Progress bar */}
                <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-t-2xl overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {step.icon && <span className="text-xl">{step.icon}</span>}
                            {step.module && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    {step.module}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={skipTour}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                        {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {step.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {/* Step counter */}
                        <div className="flex items-center gap-1.5">
                            {WALKTHROUGH_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        i === currentStep
                                            ? "w-4 bg-blue-500"
                                            : i < currentStep
                                                ? "bg-blue-300"
                                                : "bg-gray-200 dark:bg-gray-600"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Back
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200",
                                    currentStep === totalSteps - 1
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                                        : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                )}
                            >
                                {currentStep === totalSteps - 1 ? (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Get Started
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )

    return (
        <>
            {children}
            {overlay}
        </>
    )
}
