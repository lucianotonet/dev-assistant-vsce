export function getSplashWebviewContent(): string {
    return `
        <div class="w-full h-full flex items-center justify-center">
            <div class="flex lg:flex-1">
                <div
                    class="-m-1.5 p-1.5 flex flex-col lg:flex-row gap-6 items-center hover:scale-[0.995] hover:scale-y-[0.99] active:scale-y-[0.985] transition-all duration-250 ease-in-out">

                    <button
                        class="rounded-xl bg-gradient-to-tr from-green-400 to-lime-400 p-1 shadow-sm hover:bg-gradient-to-t hover:ring-offset-2 transition-all duration-100">
                        <div
                            class="bg-slate-950 rounded-md lg:rounded-lg aspect-video p-3 lg:p-4 text-2xl lg:text-3xl -tracking-widest text-white font-mono font-black">
                            <span>&gt;</span>
                            <span>_</span>
                            <span>&lt;</span>
                        </div>
                    </button>

                    <div class="text-center lg:text-left">
                        <strong class="font-black font-mono -tracking-wider text-white text-5xl">Dev Assistant</strong>
                        <br>
                        <span class="font-mono  text-xl">Just another AI development tool</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}