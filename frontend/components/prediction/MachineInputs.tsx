"use client";

import { Input } from "@/components/ui/input";

export default function MachineInputs() {
    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">

            <h2 className="text-2xl font-bold">
                Machining Parameters
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
                Configure the machining operation before prediction.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Case
                    </label>
                    <Input type="number" placeholder="1" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Run
                    </label>
                    <Input type="number" placeholder="1" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Time
                    </label>
                    <Input type="number" placeholder="10" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        DOC
                    </label>
                    <Input type="number" placeholder="2" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Feed
                    </label>
                    <Input type="number" placeholder="0.30" />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Material
                    </label>

                    <select className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm">
                        <option>Steel</option>
                        <option>Aluminium</option>
                        <option>Titanium</option>
                    </select>

                </div>

            </div>

        </div>
    );
}