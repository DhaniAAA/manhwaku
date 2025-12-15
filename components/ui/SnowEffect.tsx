"use client";

import { useEffect, useRef } from 'react';

export default function SnowEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Set canvas size
        const setSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        setSize();

        // Snowflakes configuration
        const snowflakes: { x: number; y: number; radius: number; speedY: number; speedX: number; opacity: number }[] = [];
        const snowflakeCount = 70; // Adjust for density

        // Initialize snowflakes
        for (let i = 0; i < snowflakeCount; i++) {
            snowflakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 3 + 1,
                speedY: Math.random() * 1 + 0.5,
                speedX: Math.random() * 0.5 - 0.25, // Slight horizontal drift
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            snowflakes.forEach(flake => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                ctx.fill();
            });
        }

        function update() {
            snowflakes.forEach(flake => {
                flake.y += flake.speedY;
                flake.x += flake.speedX;

                // Reset if goes off screen
                if (flake.y > height) {
                    flake.y = -flake.radius;
                    flake.x = Math.random() * width;
                }
                if (flake.x > width) {
                    flake.x = 0;
                } else if (flake.x < 0) {
                    flake.x = width;
                }
            });
        }

        let animationFrameId: number;
        function loop() {
            draw();
            update();
            animationFrameId = requestAnimationFrame(loop);
        }

        loop();

        window.addEventListener('resize', setSize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', setSize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            aria-hidden="true"
        />
    );
}
