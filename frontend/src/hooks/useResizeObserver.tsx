import { useState, useEffect } from "react";

export function useResizeObserver(ref) {
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			if (entries[0]) {
				setSize({
					width: entries[0].contentRect.width,
					height: entries[0].contentRect.height,
				});
			}
		});

		if (ref.current) {
			resizeObserver.observe(ref.current);
		}

		return () => {
			if (ref.current) {
				resizeObserver.unobserve(ref.current);
			}
		};
	}, [ref]);

	return size;
}
