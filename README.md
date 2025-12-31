# TUI Generative Art

Generative art experiments for your terminal. Built with React and [OpenTUI](https://github.com/anthropics/opentui).

![Terminal with animated generative art](https://img.shields.io/badge/terminal-art-ff6600)

## Features

- **Three interactive experiments** - Flow fields, plasma effects, and scrolling marquees
- **Real-time animation** - Smooth ~60fps rendering directly in your terminal
- **Customizable parameters** - Adjust scale, speed, colors, and display modes
- **Keyboard controls** - Full keyboard navigation and interaction
- **ASCII/Unicode rendering** - Creative use of characters to create visual effects

## Experiments

### 1. Flow Field

A vector field visualization powered by 3D Simplex noise. Watch organic patterns emerge as arrows, lines, or dots flow through the field.

**Controls:**

- `Space` - Play/Pause
- `D` - Cycle display mode (arrows → lines → dots)
- `C` - Toggle color mode (grayscale ↔ rainbow)
- `R` - Reseed the noise
- `Tab` - Switch between sliders
- `←/→` - Adjust scale/speed

### 2. Plasma

Classic demoscene-style plasma effect using layered sine waves. A nostalgic tribute to 90s demo scene graphics.

**Controls:**

- `Space` - Play/Pause
- `C` - Cycle palette (gray → rainbow → fire → ocean)
- `D` - Cycle character set (blocks → dots → ASCII)
- `Tab` - Switch between sliders
- `←/→` - Adjust scale/speed

### 3. Marquee

LED-style scrolling text banner with a custom 5x5 block font supporting letters, numbers, and punctuation.

**Controls:**

- `Space` - Play/Pause
- `M` - Cycle through preset messages
- `C` - Cycle color palette (amber → green → blue → red → white)
- `←/→` - Adjust scroll speed

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0+)

### Installation

```bash
# Clone the repository
cd tui-generative-art

# Install dependencies
bun install
```

### Running

```bash
# Start the application
bun start

# Or run in development mode (auto-reload on changes)
bun dev
```

### Navigation

- Press `1`, `2`, or `3` from the menu to select an experiment
- Press `Esc` or `Backspace` to return to the menu
- Press `Q` to quit

## Project Structure

```
src/
├── index.tsx              # Main entry point and menu system
├── components/
│   ├── ExperimentFrame.tsx  # Reusable layout wrapper
│   └── Slider.tsx           # Custom slider control
├── experiments/
│   ├── flow/
│   │   ├── FlowField.tsx    # Flow field visualization
│   │   └── noise.ts         # Simplex noise implementation
│   ├── plasma/
│   │   └── Plasma.tsx       # Plasma effect
│   └── marquee/
│       └── Marquee.tsx      # Scrolling banner
└── utils/
    └── colors.ts            # Color conversion utilities
```

## Technical Details

### Performance Optimizations

- **Segment batching**: Consecutive characters with the same color are grouped to minimize render elements
- **Quantized palettes**: Limited to 6 colors per palette to maximize batching opportunities
- **Memoized rendering**: All visualizations use `useMemo` to avoid unnecessary recalculations
- **Pre-computed lookup tables**: Color palettes and shades are computed once at load time

### Simplex Noise

The flow field uses a seeded 3D Simplex noise implementation based on Stefan Gustavson's algorithm. The third dimension (Z) represents time, enabling smooth animations.

### Color System

- HSL to RGB conversion for generating color palettes
- Brightness quantization for efficient rendering
- Pre-computed shade tables for fast lookup

## Dependencies

| Package | Purpose |
|---------|---------|
| `@opentui/core` | Core TUI renderer engine |
| `@opentui/react` | React bindings for OpenTUI |
| `react` | UI component framework |

## Contributing

Contributions are welcome! Feel free to:

- Add new experiments
- Improve existing visualizations
- Optimize rendering performance
- Fix bugs

## License

MIT

## Acknowledgments

- [OpenTUI](https://github.com/anthropics/opentui) for the terminal rendering framework
- Stefan Gustavson for the Simplex noise algorithm
- The demoscene community for inspiring the plasma effect
