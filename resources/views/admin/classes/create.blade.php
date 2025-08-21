<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Create New Class') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <form method="POST" action="{{ route('admin.classes.store') }}">
                        @csrf

                        <!-- Name -->
                        <div>
                            <label for="name" class="block font-medium text-sm text-gray-700">{{ __('Name') }}</label>
                            <input id="name" class="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" type="text" name="name" :value="old('name')" required autofocus />
                        </div>

                        <!-- Teacher -->
                        <div class="mt-4">
                            <label for="teacher_id" class="block font-medium text-sm text-gray-700">{{ __('Teacher') }}</label>
                            <select name="teacher_id" id="teacher_id" class="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                                <option value="">None</option>
                                @foreach ($teachers as $teacher)
                                    <option value="{{ $teacher->id }}">{{ $teacher->user->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <!-- Fee -->
                        <div class="mt-4">
                            <label for="fee" class="block font-medium text-sm text-gray-700">{{ __('Fee') }}</label>
                            <input id="fee" class="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" type="text" name="fee" :value="old('fee')" />
                        </div>

                        <!-- Time -->
                        <div class="mt-4">
                            <label for="time" class="block font-medium text-sm text-gray-700">{{ __('Time') }}</label>
                            <input id="time" class="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" type="time" name="time" :value="old('time')" />
                        </div>

                        <!-- Schedule Days -->
                        <div class="mt-4">
                            <label class="block font-medium text-sm text-gray-700">{{ __('Schedule Days') }}</label>
                            @foreach(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as $day)
                                <div class="flex items-center">
                                    <input type="checkbox" name="schedule_days[]" value="{{ $day }}" id="day_{{ $day }}" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                                    <label for="day_{{ $day }}" class="ml-2 block text-sm text-gray-900">{{ $day }}</label>
                                </div>
                            @endforeach
                        </div>


                        <div class="flex items-center justify-end mt-4">
                            <button type="submit" class="ml-4 inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150">
                                {{ __('Create Class') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
