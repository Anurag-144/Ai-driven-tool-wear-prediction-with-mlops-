"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-white pt-40 pb-28">
            {/* Background Gradient */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-emerald-50" />

            <div className="mx-auto max-w-7xl px-6">

                <div className="grid items-center gap-16 lg:grid-cols-2">

                    {/* Left */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: .8 }}
                    >

                        <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm shadow-sm">
                            <Cpu className="h-4 w-4 text-blue-600" />
                            AI Powered Manufacturing
                        </span>

                        <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
                            Predict Tool Wear
                            <br />
                            Before Failure Happens
                        </h1>

                        <p className="mt-8 max-w-xl text-lg leading-8 text-gray-600">
                            Advanced machine learning predicts cutting tool wear from
                            machining sensor data, helping manufacturers reduce downtime,
                            optimize maintenance, and improve production quality.
                        </p>

                        <div className="mt-10 flex gap-4">

                            <Button size="lg" className="rounded-full">
                                Try Prediction
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full"
                            >
                                View Research
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                        </div>

                    </motion.div>

                    {/* Right */}
                    <motion.div
                        initial={{ opacity: 0, scale: .95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: .9 }}
                    >

                        <div className="rounded-3xl border bg-white p-8 shadow-2xl">

                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-xl font-semibold">
                                    AI Prediction Dashboard
                                </h3>

                                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                                    Live
                                </span>
                            </div>

                            <div className="space-y-5">

                                <div>
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span>Model Confidence</span>
                                        <span>97%</span>
                                    </div>

                                    <div className="h-3 rounded-full bg-gray-200">
                                        <div className="h-3 w-[97%] rounded-full bg-blue-600"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span>Predicted Tool Wear</span>
                                        <span>0.26 VB</span>
                                    </div>

                                    <div className="h-3 rounded-full bg-gray-200">
                                        <div className="h-3 w-[70%] rounded-full bg-emerald-500"></div>
                                    </div>
                                </div>

                            </div>

                        </div>

                    </motion.div>

                </div>

            </div>
        </section>
    );
}