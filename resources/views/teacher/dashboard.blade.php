<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Teacher Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Welcome, {{ $teacher->user->name }}!</h3>

                    <div class="mt-6">
                        <h4 class="text-md font-semibold text-gray-800">Your Classes:</h4>
                        <div class="mt-4 space-y-4">
                            @forelse ($classes as $class)
                                <div class="p-4 border rounded-lg">
                                    <h5 class="text-lg font-bold">{{ $class->name }}</h5>
                                    <p class="text-sm text-gray-600">Time: {{ $class->time }}</p>
                                    <div class="mt-2">
                                        <h6 class="text-sm font-semibold">Enrolled Students:</h6>
                                        <ul class="list-disc list-inside">
                                            @forelse ($class->students as $student)
                                                <li>{{ $student->user->name }}</li>
                                            @empty
                                                <li>No students enrolled yet.</li>
                                            @endforelse
                                        </ul>
                                    </div>
                                </div>
                            @empty
                                <p>You are not assigned to any classes yet.</p>
                            @endforelse
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
