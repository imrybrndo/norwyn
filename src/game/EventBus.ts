export class CustomEventEmitter {
    private listeners: { [event: string]: Function[] } = {};

    on(event: string, fn: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(fn);
        return this;
    }

    once(event: string, fn: Function) {
        const onceWrapper = (...args: any[]) => {
            fn(...args);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
        return this;
    }

    off(event: string, fn?: Function) {
        if (!fn) {
            delete this.listeners[event];
        } else if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(f => f !== fn);
        }
        return this;
    }

    emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            // Copy list to avoid issues if listeners detach during iteration
            const list = [...this.listeners[event]];
            list.forEach(fn => fn(...args));
        }
        return this;
    }
}

export const EventBus = new CustomEventEmitter();
